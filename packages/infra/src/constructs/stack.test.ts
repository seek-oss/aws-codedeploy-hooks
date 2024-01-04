import { SynthUtils } from '@aws-cdk/assert';
import { App } from 'aws-cdk-lib';

import { HookStack } from './stack';

it('returns expected CloudFormation stack', () => {
  const app = new App();

  const stack = new HookStack(app);

  const json = JSON.stringify(SynthUtils.toCloudFormation(stack)).replaceAll(
    /"S3Key":"([0-9a-f]+)\.zip"/g,
    (_, hash) => `"S3Key":"${'x'.repeat(hash.length)}.zip"`,
  );

  expect(JSON.parse(json)).toMatchSnapshot();
});
