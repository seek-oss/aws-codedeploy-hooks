import {
  type AliasConfiguration,
  DeleteFunctionCommand,
  type FunctionConfiguration,
  GetFunctionCommand,
  ListAliasesCommand,
  ListVersionsByFunctionCommand,
} from '@aws-sdk/client-lambda';
import { Env } from 'skuba-dive';

import { lambdaClient } from '../../framework/aws.js';
import { getContext, updateTargetLambda } from '../../framework/context.js';
import { logger } from '../../framework/logging.js';

import type { LambdaFunction } from './types.js';

type Args = Pick<LambdaFunction, 'name'>;

const MAX_DELETIONS_PER_RUN = 20;

export const prune = async (fns: Args[]): Promise<void> => {
  await Promise.all(fns.map((fn) => pruneFunction(fn)));
};

export const pruneFunction = async ({ name }: Args): Promise<void> => {
  const versionsToKeep = Env.nonNegativeInteger('VERSIONS_TO_KEEP');
  const { abortSignal } = getContext();

  const getFunctionCommand = new GetFunctionCommand({
    FunctionName: name,
  });

  const [aliases, versions, metadata] = await Promise.all([
    listAliases(name, abortSignal),
    listLambdaVersions(name, abortSignal),
    lambdaClient.send(getFunctionCommand),
  ]);

  updateTargetLambda({
    service:
      metadata.Tags?.service ??
      metadata.Configuration?.Environment?.Variables?.DD_SERVICE ??
      metadata.Configuration?.FunctionName,
  });

  const aliasMap = new Map(
    aliases.flatMap((alias) =>
      alias.FunctionVersion ? [[alias.FunctionVersion, alias]] : [],
    ),
  );

  const versionsToPrune = versions
    .filter(
      (version) =>
        version.Version &&
        !aliasMap.has(version.Version) &&
        version.Version !== '$LATEST',
    )
    .sort((a, b) => Number(b.Version) - Number(a.Version))
    .slice(versionsToKeep)
    .slice(0, MAX_DELETIONS_PER_RUN);

  if (!versionsToPrune.length) {
    logger.info('No function versions to prune');
    return;
  }

  logger.info(
    `Pruning function versions: ${versionsToPrune
      .map((version) => version.Version)
      .join(', ')}`,
  );

  await Promise.all(
    versionsToPrune.map(async (version) =>
      lambdaClient.send(
        new DeleteFunctionCommand({
          FunctionName: version.FunctionName,
          Qualifier: version.Version,
        }),
        { abortSignal },
      ),
    ),
  );
};

const listLambdaVersions = async (
  functionName: string,
  abortSignal?: AbortSignal,
  marker?: string,
): Promise<FunctionConfiguration[]> => {
  const result = await lambdaClient.send(
    new ListVersionsByFunctionCommand({
      FunctionName: functionName,
      Marker: marker,
    }),
    { abortSignal },
  );
  const versions = result.Versions ?? [];
  if (result.NextMarker) {
    return [
      ...versions,
      ...(await listLambdaVersions(
        functionName,
        abortSignal,
        result.NextMarker,
      )),
    ];
  }

  return versions;
};

const listAliases = async (
  functionName: string,
  abortSignal?: AbortSignal,
  marker?: string,
): Promise<AliasConfiguration[]> => {
  const result = await lambdaClient.send(
    new ListAliasesCommand({
      FunctionName: functionName,
      Marker: marker,
    }),
    { abortSignal },
  );
  const aliases = result.Aliases ?? [];
  if (result.NextMarker) {
    return [
      ...aliases,
      ...(await listAliases(functionName, abortSignal, result.NextMarker)),
    ];
  }

  return aliases;
};
