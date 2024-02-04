import { Stack, aws_iam, aws_lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { createLambdaHookProps } from './lambda';

export type HookStackProps = Record<string, never>;

export class HookStack extends Stack {
  constructor(scope: Construct, id?: string, _props: HookStackProps = {}) {
    super(scope, id ?? 'HookStack', {
      description: 'AWS CodeDeploy hooks',
      stackName: 'aws-codedeploy-hooks',
      terminationProtection: true,
    });

    const beforeAllowTrafficHook = new aws_lambda.Function(
      this,
      'BeforeAllowTrafficHook',
      {
        ...createLambdaHookProps(),
        description: 'BeforeAllowTraffic hook deployed outside of a VPC',
        functionName: 'aws-codedeploy-hook-BeforeAllowTraffic',
        vpc: undefined,
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
