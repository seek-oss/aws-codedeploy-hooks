# @seek/aws-codedeploy-infra

[AWS CDK] infrastructure for AWS CodeDeploy Hooks.

[AWS CDK]: https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html

## Setup

AWS Lambda hooks can be deployed inline with each application in a self-contained [CloudFormation stack],
however this overhead becomes less desirable as you scale to multiple applications.

[CloudFormation stack]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacks.html

The `HookStack` construct defines a consolidated infrastructure stack that can be deployed once per environment and utilised by multiple applications in the network:

```typescript
import { HookStack } from '@seek/aws-codedeploy-infra';
import { App } from 'aws-cdk-lib';

const app = new App();

new HookStack(app);

app.synth();
```

## Usage

### Lambda function (CDK)

In a CDK stack:

```diff
+ import { LambdaDeployment } from '@seek/aws-codedeploy-infra';
import { aws_lambda_nodejs } from 'aws-cdk-lib';

const lambdaFunction = new aws_lambda_nodejs.NodejsFunction(
  this,
  'MyLambdaFunction',
  {
    // ...
  },
);

+ new LambdaDeployment(this, 'MyLambdaDeployment', { lambdaFunction });
```

The `LambdaDeployment` construct creates a CodeDeploy application and deployment group for your Lambda function,
and applies an `aws-codedeploy-hooks` tag to enable AWS Lambda hooks to [access these resources].

A `BeforeAllowTraffic` hook is registered to check that an incoming Lambda function version is healthy before cutting traffic over to its `Live` alias [all at once].
The hook invokes the incoming Lambda function version with a "smoke test" payload that looks like so:

```typescript
import assert from 'assert';

export const handler = (event: Event, ctx: Context) => {
  // An empty event object `{}`
  assert.strictEqual(Object.keys(event).length, 0);

  // A context object with a custom user agent prop
  assert.strictEqual(
    typeof ctx.clientContext?.Custom?.['user-agent'],
    'string',
  );
};
```

This payload can be recognised by the [`isLambdaHook`] runtime helper.

[access these resources]: https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_attribute-based-access-control.html
[all at once]: https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-configurations.html#deployment-configurations-predefined-lambda
[`isLambdaHook`]: ../hooks/README.md#islambdahook
