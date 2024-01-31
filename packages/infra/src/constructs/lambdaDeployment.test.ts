import { App, Stack, assertions, aws_lambda } from 'aws-cdk-lib';

import { LambdaDeployment } from './lambdaDeployment';

jest.mock('../version', () => ({
  commit: 'abcdefg',
  version: '0.0.0',
}));

it('returns expected CloudFormation stack', () => {
  const app = new App();

  const stack = new Stack(app);

  const lambdaFunction = new aws_lambda.Function(stack, 'LambdaFunction', {
    code: aws_lambda.Code.fromInline(
      'export const handler = async () => undefined;',
    ),
    handler: 'index.handler',
    runtime: aws_lambda.Runtime.NODEJS_20_X,
  });

  // eslint-disable-next-line no-new
  new LambdaDeployment(stack, null, { lambdaFunction });

  const template = assertions.Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Alias', 1);
  template.hasResourceProperties('AWS::Lambda::Alias', {
    Name: 'Live',
  });

  template.resourceCountIs('AWS::Lambda::Function', 1);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Tags: [{ Key: 'aws-codedeploy-hooks' }],
  });

  template.resourceCountIs('AWS::CodeDeploy::Application', 1);
  template.hasResourceProperties('AWS::CodeDeploy::Application', {
    ComputePlatform: 'Lambda',
    Tags: [{ Key: 'aws-codedeploy-hooks' }],
  });

  template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
  template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
    AutoRollbackConfiguration: {
      Enabled: true,
      Events: ['DEPLOYMENT_FAILURE'],
    },
    DeploymentConfigName: 'CodeDeployDefault.LambdaAllAtOnce',
    DeploymentStyle: {
      DeploymentOption: 'WITH_TRAFFIC_CONTROL',
      DeploymentType: 'BLUE_GREEN',
    },
    Tags: [{ Key: 'aws-codedeploy-hooks' }],
  });

  const json = JSON.stringify(template.toJSON());

  expect(JSON.parse(json)).toMatchSnapshot();
});
