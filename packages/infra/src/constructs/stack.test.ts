import { App, assertions } from 'aws-cdk-lib';

import { HookStack } from './stack.js';

it('returns expected CloudFormation stack', () => {
  const app = new App();

  const stack = new HookStack(app);

  const template = assertions.Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 2);

  template.resourcePropertiesCountIs(
    'AWS::Lambda::Function',
    { VpcConfig: {} },
    0,
  );

  const json = JSON.stringify(template.toJSON())
    .replaceAll(
      /"S3Key":"([0-9a-f]+)\.zip"/g,
      (_, hash) => `"S3Key":"${'x'.repeat(hash.length)}.zip"`,
    )
    .replaceAll(/"VERSION":"\d+\.\d+\.\d+"/g, `"VERSION":"x.y.z"`);

  expect(JSON.parse(json)).toMatchSnapshot();
});

it('supports a custom ID', () => {
  const app = new App();

  const stack = new HookStack(app, 'MyStack');

  const template = assertions.Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 2);
});

describe('StackProps', () => {
  it('should use default values when none are provided', () => {
    const app = new App();

    const defaultStack = new HookStack(app);
    expect(defaultStack.stackName).toBe('aws-codedeploy-hooks');
    expect(defaultStack.tags.hasTags()).toBeFalsy();
  });

  it('should override the defaults when provided', () => {
    const app = new App();

    const customStack = new HookStack(app, 'CustomStack', {
      stackName: 'custom',
      tags: { 'seek:custom:tag': 'value' },
    });
    expect(customStack.stackName).toBe('custom');
    expect(customStack.tags.hasTags()).toBeTruthy();
    expect(customStack.tags.tagValues()).toEqual({
      'seek:custom:tag': 'value',
    });
  });
});
