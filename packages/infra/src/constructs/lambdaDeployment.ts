import { containsSkipDirective } from '@seek/aws-codedeploy-hooks';
import {
  Duration,
  Tags,
  aws_cloudwatch,
  aws_codedeploy,
  aws_lambda,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { commit, version } from '../version';

const tagValue = `${version}-${commit}`;

export type LambdaDeploymentProps = {
  lambdaFunction: aws_lambda.Function;
  buildMessage?: string;
};

export class LambdaDeployment extends Construct {
  alias: Readonly<aws_lambda.Alias>;

  constructor(
    scope: Construct,
    id: string | null,
    {
      lambdaFunction,
      buildMessage = process.env.BUILDKITE_MESSAGE,
    }: LambdaDeploymentProps,
  ) {
    super(scope, id ?? 'LambdaDeployment');

    Tags.of(lambdaFunction).add('aws-codedeploy-hooks', tagValue);

    const alias = lambdaFunction.addAlias('Live', {
      description: 'The Lambda version currently receiving traffic',
    });

    this.alias = alias;

    const application = new aws_codedeploy.LambdaApplication(
      this,
      'CodeDeployLambdaApplication',
    );

    Tags.of(application).add('aws-codedeploy-hooks', tagValue);

    const deploymentGroup = new aws_codedeploy.LambdaDeploymentGroup(
      this,
      'CodeDeployLambdaDeploymentGroup',
      {
        application,
        alias,
        deploymentConfig: aws_codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
      },
    );

    Tags.of(deploymentGroup).add('aws-codedeploy-hooks', tagValue);

    deploymentGroup.addPreHook(
      aws_lambda.Function.fromFunctionName(
        this,
        'LambdaFunctionPreHook',
        'aws-codedeploy-hook-BeforeAllowTraffic',
      ),
    );

    deploymentGroup.addPostHook(
      aws_lambda.Function.fromFunctionName(
        this,
        'LambdaFunctionPostHook',
        'aws-codedeploy-hook-AfterAllowTraffic',
      ),
    );

    if (!containsSkipDirective(buildMessage, 'alarm')) {
      deploymentGroup.addAlarm(
        new aws_cloudwatch.Alarm(this, 'CodeDeployAlarm', {
          metric: lambdaFunction.metricErrors({
            period: Duration.seconds(30),
          }),
          threshold: 1,
          evaluationPeriods: 1,
          alarmDescription:
            'Used to roll back the deployment if there are errors. This can be skipped with a [skip alarm] directive in the build message.',
        }),
      );
    }
  }
}
