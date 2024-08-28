import {
  type AliasConfiguration,
  DeleteFunctionCommand,
  type FunctionConfiguration,
  LambdaClient,
  ListAliasesCommand,
  ListVersionsByFunctionCommand,
} from '@aws-sdk/client-lambda';
import { Env } from 'skuba-dive';

import { getContext } from '../../framework/context';
import { logger } from '../../framework/logging';

import type { LambdaFunction } from './types';

type Args = Pick<LambdaFunction, 'name'>;

const MAX_DELETIONS_PER_RUN = 20;

const lambda = new LambdaClient();

export const prune = async (fns: Args[]): Promise<void> => {
  await Promise.all(fns.map((fn) => pruneFunction(fn)));
};

export const pruneFunction = async ({ name }: Args): Promise<void> => {
  const versionsToKeep = Env.nonNegativeInteger('VERSIONS_TO_KEEP');
  const { abortSignal } = getContext();

  const [aliases, versions] = await Promise.all([
    listAliases(name, abortSignal),
    listLambdaVersions(name, abortSignal),
  ]);

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
    versionsToPrune.map((version) =>
      lambda.send(
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
  const result = await lambda.send(
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
  const result = await lambda.send(
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
