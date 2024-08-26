import { Stack, aws_iam, aws_lambda } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import { createLambdaHookProps } from './lambda';

const hooks = ['BeforeAllowTraffic', 'AfterAllowTraffic'] as const;

type HookName = (typeof hooks)[number];

export type HookStackProps = {
  prune?: {
    versionsToKeep?: number;
  };
};

export class HookStack extends Stack {
  constructor(scope: Construct, id?: string, props: HookStackProps = {}) {
    super(scope, id ?? 'HookStack', {
      description: 'AWS CodeDeploy hooks',
      stackName: 'aws-codedeploy-hooks',
      terminationProtection: true,
    });

    this.addHook('BeforeAllowTraffic', {}, [
      'codedeploy:GetApplicationRevision',
      'codedeploy:GetDeployment',
      'codedeploy:PutLifecycleEventHookExecutionStatus',
      'lambda:InvokeFunction',
    ]);

    this.addHook(
      'AfterAllowTraffic',
      {
        VERSIONS_TO_KEEP: (props.prune?.versionsToKeep ?? 3).toString(),
      },
      [
        'lambda:ListAliases',
        'lambda:ListVersionsByFunction',
        'lambda:DeleteFunction',
      ],
    );
  }

  private addHook(
    hook: HookName,
    environment: Record<string, string>,
    actions: string[],
  ): void {
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
    hookFunction.addToRolePolicy(
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
