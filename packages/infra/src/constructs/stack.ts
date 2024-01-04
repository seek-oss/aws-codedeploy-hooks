import { Stack, aws_iam } from 'aws-cdk-lib';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

import { LAMBDA_HOOK_PROPS } from './lambda';

export type HookStackProps = Record<string, never>;

export class HookStack extends Stack {
  constructor(scope: Construct, id?: string, _props: HookStackProps = {}) {
    super(scope, id ?? 'HookStack', {
      description: 'AWS CodeDeploy hooks',
      stackName: 'aws-codedeploy-hooks',
      // TODO: set tags
      tags: undefined,
      terminationProtection: true,
    });

    const beforeAllowTrafficHook = new nodejs.NodejsFunction(
      this,
      'BeforeAllowTrafficHook',
      {
        ...LAMBDA_HOOK_PROPS,
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
        resources: ['*'],
      }),
    );
  }
}
