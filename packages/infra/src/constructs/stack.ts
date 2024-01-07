import { Stack, aws_iam } from 'aws-cdk-lib';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

import { LAMBDA_HOOK_PROPS } from './lambda';
import { type Network, processNetwork } from './network';

export type HookStackProps = {
  additionalNetworks?: Network[];
};

export class HookStack extends Stack {
  constructor(
    scope: Construct,
    id?: string,
    { additionalNetworks }: HookStackProps = {},
  ) {
    super(scope, id ?? 'HookStack', {
      description: 'AWS CodeDeploy hooks',
      stackName: 'aws-codedeploy-hooks',
      // TODO: set tags
      tags: undefined,
      terminationProtection: true,
    });

    for (const network of [null, ...(additionalNetworks ?? [])]) {
      const { description, suffix, vpc } = processNetwork(this, network);

      const beforeAllowTrafficHook = new nodejs.NodejsFunction(
        this,
        `BeforeAllowTrafficHook${suffix}`,
        {
          ...LAMBDA_HOOK_PROPS,
          description,
          functionName: `aws-codedeploy-hook-BeforeAllowTraffic${suffix}`,
          vpc,
        },
      );

      beforeAllowTrafficHook.addToRolePolicy(
        new aws_iam.PolicyStatement({
          actions: [
            'codedeploy:GetApplicationRevision',
            'codedeploy:GetDeployment',
            'codedeploy:PutLifecycleEventHookExecutionStatus',
            'lambda:InvokeFunction',
          ],
          resources: ['*'],
        }),
      );
    }
  }
}
