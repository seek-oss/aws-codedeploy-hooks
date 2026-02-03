import { Stack, type StackProps, aws_iam, aws_lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { version } from '../version.js';

import { createLambdaHookProps } from './lambda.js';

type HookName = 'BeforeAllowTraffic' | 'AfterAllowTraffic';

export type HookStackProps = StackProps & {
  prune?: {
    versionsToKeep?: number;
  };
};

const defaultProps: HookStackProps = {
  description: 'AWS CodeDeploy hooks',
  stackName: 'aws-codedeploy-hooks',
  terminationProtection: true,
};

export class HookStack extends Stack {
  constructor(scope: Construct, id?: string, props: HookStackProps = {}) {
    super(scope, id ?? 'HookStack', {
      ...defaultProps,
      ...props,
    });

    this.addHook(
      'BeforeAllowTraffic',
      {
        VERSION: version,
      },
      ['lambda:GetFunction', 'lambda:InvokeFunction'],
    );

    this.addHook(
      'AfterAllowTraffic',
      {
        VERSION: version,
        VERSIONS_TO_KEEP: (props.prune?.versionsToKeep ?? 3).toString(),
      },
      [
        'lambda:GetFunction',
        'lambda:ListAliases',
        'lambda:ListVersionsByFunction',
        'lambda:DeleteFunction',
      ],
    );
  }

  private addHook(
    hook: HookName,
    environment: Record<string, string>,
    baseActions: string[],
  ): void {
    const actions = [
      'codedeploy:GetApplicationRevision',
      'codedeploy:GetDeployment',
      'codedeploy:PutLifecycleEventHookExecutionStatus',
      ...baseActions,
    ];

    const hookFunction = new aws_lambda.Function(this, `${hook}Hook`, {
      ...createLambdaHookProps(environment),
      description: `${hook} hook deployed outside of a VPC`,
      functionName: `aws-codedeploy-hook-${hook}`,
      vpc: undefined,
    });

    hookFunction.addToRolePolicy(
      new aws_iam.PolicyStatement({
        actions,
        effect: aws_iam.Effect.ALLOW,
        resources: ['*'],
      }),
    );

    // Deny access to resources that lack an `aws-codedeploy-hooks` tag.
    hookFunction.addToRolePolicy(
      new aws_iam.PolicyStatement({
        actions,
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
    hookFunction.addToRolePolicy(
      new aws_iam.PolicyStatement({
        actions,
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
