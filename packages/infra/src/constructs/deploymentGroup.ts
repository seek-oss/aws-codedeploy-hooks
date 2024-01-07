import { Tags, aws_codedeploy, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class LambdaDeployment extends Construct {
  constructor(scope: Construct, id: string | null, fn: aws_lambda.Function) {
    super(scope, id ?? 'LambdaDeployment');

    Tags.of(fn).add('aws-codedeploy-hooks', 'true');

    const alias = fn.addAlias('Live', {
      description: 'The Lambda version currently receiving traffic',
    });

    const application = new aws_codedeploy.LambdaApplication(
      this,
      'codedeploy-application',
    );

    const deploymentGroup = new aws_codedeploy.LambdaDeploymentGroup(
      this,
      'codedeploy-group',
      {
        application,
        alias,
        deploymentConfig: aws_codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
      },
    );

    deploymentGroup.addPreHook(
      aws_lambda.Function.fromFunctionName(
        this,
        'pre-hook',
        'aws-codedeploy-hook-BeforeAllowTraffic',
      ),
    );

    deploymentGroup.addPostHook(
      aws_lambda.Function.fromFunctionName(
        this,
        'pre-hook',
        'aws-codedeploy-hook-AfterAllowTraffic',
      ),
    );
  }
}
