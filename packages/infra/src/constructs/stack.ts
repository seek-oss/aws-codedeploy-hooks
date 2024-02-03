import { Stack, aws_iam, aws_lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { createLambdaHookProps } from './lambda';
import { type Network, getNetworkConfig } from './network';

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
      terminationProtection: true,
    });

    for (const network of [null, ...(additionalNetworks ?? [])]) {
      const { description, suffix, vpc } = getNetworkConfig(this, network);

      const beforeAllowTrafficHook = new aws_lambda.Function(
        this,
        `BeforeAllowTrafficHook${suffix}`,
        {
          ...createLambdaHookProps(),
          description,
          functionName: `aws-codedeploy-hook-BeforeAllowTraffic${suffix}`,
          vpc,
        },
      );

      // TODO: consider creating a shared policy that is used across the hooks.

      beforeAllowTrafficHook.addToRolePolicy(
        new aws_iam.PolicyStatement({
          actions: [
            'codedeploy:GetApplicationRevision',
            'codedeploy:GetDeployment',
            'codedeploy:PutLifecycleEventHookExecutionStatus',
            'lambda:InvokeFunction',
          ],
          effect: aws_iam.Effect.ALLOW,
          resources: ['*'],
        }),
      );

      // Deny access to resources that lack an `aws-codedeploy-hooks` tag.
      beforeAllowTrafficHook.addToRolePolicy(
        new aws_iam.PolicyStatement({
          actions: ['*'],
          conditions: {
            Null: {
              'aws:ResourceTag/aws-codedeploy-hooks': 'true',
            },
          },
          effect: aws_iam.Effect.DENY,
          resources: ['*'],
        }),
      );

      // Deny access to resources that have a falsy `aws-codedeploy-hooks` tag.
      beforeAllowTrafficHook.addToRolePolicy(
        new aws_iam.PolicyStatement({
          actions: ['*'],
          conditions: {
            StringEquals: {
              'aws:ResourceTag/aws-codedeploy-hooks': ['', 'false'],
            },
          },
          effect: aws_iam.Effect.DENY,
          resources: ['*'],
        }),
      );
    }
  }
}
