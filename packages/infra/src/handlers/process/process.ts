import {
  GetDeploymentCommand,
  type DeploymentInfo as RawDeploymentInfo,
} from '@aws-sdk/client-codedeploy';

import { codeDeployClient } from '../framework/aws.js';
import { getAbortSignal } from '../framework/context.js';
import type { CodeDeployLifecycleHookEvent } from '../types.js';

import { lambda } from './lambda/lambda.js';

export type DeploymentInfo = {
  applicationName: string;
  revision: NonNullable<RawDeploymentInfo['revision']>;
};

export const getDeploymentInfo = async (
  event: CodeDeployLifecycleHookEvent,
): Promise<DeploymentInfo> =>
  parseDeploymentInfo(
    (
      await codeDeployClient.send(
        new GetDeploymentCommand({ deploymentId: event.DeploymentId }),
        { abortSignal: getAbortSignal() },
      )
    ).deploymentInfo ?? {},
  );

export const process = async (
  deploymentInfo: DeploymentInfo,
): Promise<unknown> => lambda(deploymentInfo);

export const processEvent = async (event: CodeDeployLifecycleHookEvent) =>
  process(await getDeploymentInfo(event));

export const parseDeploymentInfo = ({
  applicationName,
  computePlatform,
  deploymentGroupName,
  deploymentStyle,
  revision,
}: RawDeploymentInfo): DeploymentInfo => {
  if (
    !applicationName ||
    !computePlatform ||
    !deploymentGroupName ||
    !deploymentStyle ||
    !revision
  ) {
    const missingProperties = Object.entries({
      applicationName,
      computePlatform,
      deploymentGroupName,
      deploymentStyle,
      revision,
    })
      .flatMap(([key, value]) => (value ? [] : key))
      .join(', ');

    throw new Error(
      `The following deployment properties are missing: ${missingProperties}`,
    );
  }

  if (deploymentStyle.deploymentOption !== 'WITH_TRAFFIC_CONTROL') {
    throw new Error(
      `The following deployment option is not supported: ${deploymentStyle.deploymentOption}`,
    );
  }

  if (deploymentStyle.deploymentType !== 'BLUE_GREEN') {
    throw new Error(
      `The following deployment type is not supported: ${deploymentStyle.deploymentType}`,
    );
  }

  if (computePlatform !== 'Lambda') {
    throw new Error(
      `The following compute platform is not supported: ${computePlatform}`,
    );
  }

  return { applicationName, revision };
};
