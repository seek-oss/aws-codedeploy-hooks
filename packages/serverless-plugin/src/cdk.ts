import assert from 'assert';

import { LambdaDeployment } from '@seek/aws-codedeploy-infra';
import { App, type CfnResource, Stack, aws_iam, aws_lambda } from 'aws-cdk-lib';

import { templateSchema } from './cfn';

type Props = {
  logicalIds: Array<{
    lambdaFunction: string;
    lambdaVersion: string;
  }>;
};

export const synthLambaDeploymentResources = ({ logicalIds }: Props) => {
  const app = new App();

  const stack = new Stack(app);

  const logicalIdSet = new Set<string>();

  for (const [index, logicalId] of logicalIds.entries()) {
    const role = new aws_iam.Role(stack, 'Role', {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const lambdaFunction = new aws_lambda.Function(stack, 'LambdaFunction', {
      code: aws_lambda.Code.fromInline(
        'export const handler = () => undefined;',
      ),
      handler: 'index.handler',
      role,
      runtime: aws_lambda.Runtime.NODEJS_LATEST,
    });

    const lambdaVersion = new aws_lambda.Version(stack, 'LambdaVersion', {
      lambda: lambdaFunction,
    });

    const roleLogicalId = `PlaceholderRole${index}`;

    // https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_resource
    for (const [construct, id] of [
      [lambdaFunction, logicalId.lambdaFunction],
      [lambdaVersion, logicalId.lambdaVersion],
      [role, roleLogicalId],
    ] as const) {
      const cfnResource = construct.node.defaultChild as CfnResource;
      cfnResource.overrideLogicalId(id);

      logicalIdSet.add(id);
    }

    // eslint-disable-next-line no-new
    new LambdaDeployment(stack, null, {
      lambdaFunction,
      lambdaVersion,
    });
  }

  const { stacks } = app.synth();

  const rawTemplate: unknown = stacks[0]?.template;

  const template = templateSchema.parse(rawTemplate);

  const { Mappings, Resources } = template;

  for (const logicalId of logicalIdSet) {
    delete Resources[logicalId];
  }

  const resourceTypes = Object.values(Resources).map<string>(
    (resource) => resource.Type,
  );

  const expectedResourceTypes = new Set([
    'AWS::CodeDeploy::Application',
    'AWS::CodeDeploy::DeploymentGroup',
    'AWS::IAM::Policy',
    'AWS::IAM::Role',
    'AWS::Lambda::Alias',
  ]);

  assert.strictEqual(expectedResourceTypes.size, new Set(resourceTypes).size);
  assert.strictEqual(
    resourceTypes.length,
    expectedResourceTypes.size * logicalIds.length,
  );

  for (const resourceType of resourceTypes) {
    assert.strictEqual(expectedResourceTypes.has(resourceType), true);
  }

  return {
    Mappings,
    Resources,
  };
};
