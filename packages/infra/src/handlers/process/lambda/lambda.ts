import {
  type DeploymentInfo,
  GetApplicationRevisionCommand,
} from '@aws-sdk/client-codedeploy';

import { config } from '../../config';
import { codeDeployClient } from '../../framework/aws';
import { getContext } from '../../framework/context';

import { type LambdaAppSpec, lambdaAppSpec } from './schema';
import { smokeTest } from './smokeTest';
import type { LambdaFunction } from './types';

export type Options = {
  applicationName: string;
  revision: NonNullable<DeploymentInfo['revision']>;
};

export const lambda = async ({
  applicationName,
  revision,
}: Options): Promise<void> => {
  const { abortSignal } = getContext();

  const output = await codeDeployClient.send(
    new GetApplicationRevisionCommand({ applicationName, revision }),
    { abortSignal },
  );

  let appSpec: LambdaAppSpec;
  try {
    const json: unknown = JSON.parse(output.revision?.string?.content ?? '');

    appSpec = lambdaAppSpec.parse(json);
  } catch (err) {
    throw new Error(
      `Application revision not in expected format: ${String(err)}`,
    );
  }

  // Resources and Hooks aren't co-dependent.
  // We loop through and flatten all Lambda function resources, though we
  // technically expect a maximum of one hook or resource per array entry.
  const fns: LambdaFunction[] = appSpec.Resources.flatMap((resourceMap) =>
    Object.values(resourceMap).map((resource) => ({
      name: resource.Properties.Name,
      version: resource.Properties.TargetVersion,
    })),
  );

  switch (inferLifecycleEvent(appSpec.Hooks)) {
    case 'BeforeAllowTraffic':
      return smokeTest(fns);
  }
};

type LifecycleEvent = 'BeforeAllowTraffic' | 'AfterAllowTraffic';

const inferLifecycleEvent = (
  hooks: LambdaAppSpec['Hooks'],
): Exclude<LifecycleEvent, 'AfterAllowTraffic'> => {
  const isPreHook = hooks.some(
    (hook) => hook.BeforeAllowTraffic === config.functionName,
  );

  const isPostHook = hooks.some(
    (hook) => hook.AfterAllowTraffic === config.functionName,
  );

  if (!isPreHook && !isPostHook) {
    throw new Error(
      'Application spec does not specify the current function as a hook',
    );
  }

  // As of 2024-01-01, there doesn't seem to be an obvious way for a hook to
  // introspect its lifecycle event via input parameters or the CodeDeploy API.
  // Instead, we configure the hook with a different name per lifecycle event,
  // which should give us mutually exclusivity at this point.
  if (isPreHook && isPostHook) {
    throw new Error(
      'You cannot configure the same Lambda function for BeforeAllowTraffic and AfterAllowTraffic',
    );
  }

  if (isPostHook) {
    throw new Error('AfterAllowTraffic is not yet supported');
  }

  return 'BeforeAllowTraffic';
};
