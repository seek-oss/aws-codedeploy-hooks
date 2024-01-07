import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

import { HookStack } from './stack';

it('returns expected CloudFormation stack', () => {
  const app = new App();

  const stack = new HookStack(app);

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 1);

  template.resourcePropertiesCountIs(
    'AWS::Lambda::Function',
    { VpcConfig: {} },
    0,
  );

  const json = JSON.stringify(template.toJSON()).replaceAll(
    /"S3Key":"([0-9a-f]+)\.zip"/g,
    (_, hash) => `"S3Key":"${'x'.repeat(hash.length)}.zip"`,
  );

  expect(JSON.parse(json)).toMatchSnapshot();
});

it('supports additional networks', () => {
  jest
    .spyOn(Vpc, 'fromLookup')
    .mockImplementation((scope, id) => new Vpc(scope, id));

  const app = new App();

  const stack = new HookStack(app, undefined, {
    additionalNetworks: [
      {
        type: 'seek-managed-network',
        name: 'development',
      },
      {
        type: 'vpc',
        id: 'mock-id',
        label: 'mock-label',
      },
    ],
  });

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 3);

  template.resourcePropertiesCountIs(
    'AWS::Lambda::Function',
    { VpcConfig: {} },
    2,
  );
});
