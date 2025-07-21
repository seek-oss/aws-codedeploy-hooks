import {
  type DeploymentInfo,
  GetDeploymentCommand,
} from '@aws-sdk/client-codedeploy';

import { codeDeployClient } from '../framework/aws.js';
import { getAbortSignal } from '../framework/context.js';
import type { CodeDeployLifecycleHookEvent } from '../types.js';

import { lambda } from './lambda/lambda.js';

export const processEvent = async (
  event: CodeDeployLifecycleHookEvent,
): Promise<unknown> => {
  const { deploymentInfo } = await codeDeployClient.send(
    new GetDeploymentCommand({ deploymentId: event.DeploymentId }),
    { abortSignal: getAbortSignal() },
  );

  const opts = parseDeploymentInfo(deploymentInfo ?? {});

  return lambda(opts);
};

export const parseDeploymentInfo = ({
  applicationName,
  computePlatform,
  deploymentGroupName,
  deploymentStyle,
  revision,
}: DeploymentInfo) => {
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
