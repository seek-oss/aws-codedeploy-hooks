// import { App } from 'aws-cdk-lib';

// import { HookStack } from '../../infra/src/constructs';

// const app = new App();

// // eslint-disable-next-line no-new
// new HookStack(app, undefined, {
//   network: undefined,
//   stackName: undefined,
//   tags: undefined,
// });

// app.synth();

import { handler } from '../handlers';

const main = async () => {
  await handler(
    {
      DeploymentId: 'd-BDIUAXOP2',
      LifecycleEventHookExecutionId: 'fake',
    },
    {
      awsRequestId: 'local',
      getRemainingTimeInMillis: () => 300_000,
    },
  );

  // await handler({
  //   DeploymentId: 'd-KQ41054F2',
  //   LifecycleEventHookExecutionId: '123',
  // });

  // await handler({
  //   DeploymentId: 'd-F0CYX38F2',
  //   LifecycleEventHookExecutionId: '123',
  // });
};

main().catch((err) => {
  throw err;
});
