import { Tags, aws_codedeploy, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { commit, version } from '../version';

const tagValue = `${version}-${commit}`;

export type LambdaDeploymentProps =
  | {
      lambdaFunction: aws_lambda.Function;
    }
  | {
      lambdaFunction: aws_lambda.IFunction;
      lambdaVersion: aws_lambda.IVersion;
    };

export class LambdaDeployment extends Construct {
  alias: Readonly<aws_lambda.Alias>;

  constructor(
    scope: Construct,
    id: string | null,
    props: LambdaDeploymentProps,
  ) {
    super(scope, id ?? 'LambdaDeployment');

    Tags.of(props.lambdaFunction).add('aws-codedeploy-hooks', tagValue);

    const alias = new aws_lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'Live',
      description: 'The Lambda version currently receiving traffic',
      version:
        'lambdaVersion' in props
          ? props.lambdaVersion
          : props.lambdaFunction.currentVersion,
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
  }
}
