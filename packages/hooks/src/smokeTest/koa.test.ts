import createLogger from '@seek/logger';
import Koa from 'koa';
import { agent } from 'supertest';

import { koaMiddleware } from './koa';

const onError = jest.fn();
const write = jest.fn();

const stdout = () => write.mock.calls.flat().join('').trim();

afterEach(jest.clearAllMocks);

const logger = createLogger(
  { serializers: { err: (err) => String(err) }, timestamp: false },
  { write: (msg) => write(msg) },
);

type Options = {
  skipHook: Parameters<typeof koaMiddleware>[0]['skipHook'];
  smokeTest: Parameters<typeof koaMiddleware>[1];
  userAgent: string;
};

const run = ({ skipHook, smokeTest, userAgent }: Options) => {
  const app = new Koa()
    .use(koaMiddleware({ logger, skipHook }, smokeTest))
    .on('error', onError);

  return agent(app.callback()).get('/').set('User-Agent', userAgent);
};

it.each`
  skipHook | userAgent
  ${true}  | ${'Mozilla/5.0'}
  ${false} | ${'aws-codedeploy-hook-BeforeAllowTraffic/1.2.3'}
  ${false} | ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
  ${false} | ${'Mozilla/5.0'}
`(
  'handles a foreground smoke test with skipHook: $skipHook and userAgent: $userAgent',
  async ({ skipHook, userAgent }) => {
    await run({
      skipHook,
      smokeTest: () => undefined,
      userAgent,
    }).expect(200, 'Smoke test succeeded');

    expect(onError).not.toHaveBeenCalled();
    expect(stdout()).toBeFalsy();
  },
);

it.each`
  skipHook | userAgent
  ${true}  | ${'aws-codedeploy-hook-BeforeAllowTraffic/1.2.3'}
  ${true}  | ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
`(
  'handles a background smoke test with skipHook: $skipHook and userAgent: $userAgent',
  async ({ skipHook, userAgent }) => {
    await run({
      skipHook,
      smokeTest: () => undefined,
      userAgent,
    }).expect(200, 'Smoke test skipped');

    expect(onError).not.toHaveBeenCalled();
    expect(stdout()).toBe(
      '{"level":30,"msg":"Smoke test succeeded in background"}',
    );
  },
);

it.each`
  userAgent
  ${'aws-codedeploy-hook-BeforeAllowTraffic/123'}
  ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
`(
  'skips a synchronous error with skipHook: true and userAgent: $userAgent',
  async ({ userAgent }) => {
    await run({
      skipHook: true,
      smokeTest: () => {
        throw new Error('Badness!');
      },
      userAgent,
    }).expect(200, 'Smoke test skipped');

    expect(onError).not.toHaveBeenCalled();
    expect(stdout()).toBe(
      '{"level":40,"err":"Error: Badness!","msg":"Smoke test failed in background"}',
    );
  },
);

it.each`
  userAgent
  ${'aws-codedeploy-hook-BeforeAllowTraffic/123'}
  ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
`(
  'skips an asynchronous error with skipHook: true and userAgent: $userAgent',
  async ({ userAgent }) => {
    await run({
      skipHook: true,
      smokeTest: () => Promise.reject(new Error('Badness!')),
      userAgent,
    }).expect(200, 'Smoke test skipped');

    expect(onError).not.toHaveBeenCalled();
    expect(stdout()).toBe(
      '{"level":40,"err":"Error: Badness!","msg":"Smoke test failed in background"}',
    );
  },
);

it.each`
  skipHook | userAgent
  ${true}  | ${'Mozilla/5.0'}
  ${false} | ${'aws-codedeploy-hook-BeforeAllowTraffic/123'}
  ${false} | ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
  ${false} | ${'Mozilla/5.0'}
`(
  'throws a synchronous error with skipHook: $skipHook and userAgent: $userAgent',
  async ({ skipHook, userAgent }) => {
    await run({
      skipHook,
      smokeTest: () => {
        throw new Error('Badness!');
      },
      userAgent,
    }).expect(500, 'Internal Server Error');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(stdout()).toBeFalsy();
  },
);

it.each`
  skipHook | userAgent
  ${true}  | ${'Mozilla/5.0'}
  ${false} | ${'aws-codedeploy-hook-BeforeAllowTraffic/123'}
  ${false} | ${'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3'}
  ${false} | ${'Mozilla/5.0'}
`(
  'throws an asynchronous error with skipHook: $skipHook and userAgent: $userAgent',
  async ({ skipHook, userAgent }) => {
    await run({
      skipHook,
      smokeTest: () => Promise.reject(new Error('Badness!')),
      userAgent,
    }).expect(500, 'Internal Server Error');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(stdout()).toBeFalsy();
  },
);

it('passes no arguments to the smoke test function asynchronously', async () => {
  const smokeTest = jest.fn();

  await run({
    skipHook: true,
    smokeTest,
    userAgent: 'aws-codedeploy-hook-BeforeAllowTraffic/123',
  }).expect(200, 'Smoke test skipped');

  expect(onError).not.toHaveBeenCalled();
  expect(stdout()).toBe(
    '{"level":30,"msg":"Smoke test succeeded in background"}',
  );

  expect(smokeTest).toHaveBeenCalledTimes(1);
  expect(smokeTest).toHaveBeenLastCalledWith();
});

it('passes no arguments to the smoke test function synchronously', async () => {
  const smokeTest = jest.fn();

  await run({
    skipHook: false,
    smokeTest,
    userAgent: 'Mozilla/5.0',
  }).expect(200, 'Smoke test succeeded');

  expect(onError).not.toHaveBeenCalled();
  expect(stdout()).toBe('');

  expect(smokeTest).toHaveBeenCalledTimes(1);
  expect(smokeTest).toHaveBeenLastCalledWith();
});
