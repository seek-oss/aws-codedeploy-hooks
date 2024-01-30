import { App, assertions } from 'aws-cdk-lib';

import { HookStack } from './stack';

it('returns expected CloudFormation stack', () => {
  const app = new App();

  const stack = new HookStack(app);

  const template = assertions.Template.fromStack(stack);

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
