# @seek/aws-codedeploy-hooks

[![npm package](https://img.shields.io/npm/v/%40seek/aws-codedeploy-hooks)](https://www.npmjs.com/package/@seek/aws-codedeploy-hooks)

Runtime helpers for working with AWS CodeDeploy Hooks.

## Usage

### `isHttpHook`

Whether the HTTP request originated from AWS CodeDeploy Hooks.

This can be used to customise smoke test handling.
When recovering a system with unhealthy dependencies,
it may be desirable to expedite recovery efforts by skipping pre-deployment checks,
while continuing to run the checks as per usual on subsequent health check polling.

```typescript
const smokeTest = (req: Request) => {
  if (process.env.SKIP_HOOK && isHttpHook(req)) {
    // Expedite deployment even if dependencies are unhealthy.
    return;
  }

  // Run dependency checks otherwise.
  return checkDependencies();
};
```

Checks for a `user-agent` header that starts with either:

- `aws-codedeploy-hooks/`
- `gantry-codedeploy-hook-BeforeAllowTraffic-`

Compatible with Gantry v2.3.7 and newer.

### `isLambdaHook`

Whether the Lambda invocation originated from AWS CodeDeploy Hooks.

This can be used to customise smoke test handling.
When recovering a system with unhealthy dependencies,
it may be desirable to expedite recovery efforts by skipping pre-deployment checks,
while continuing to run the checks as per usual on subsequent health check polling.

```typescript
const handler = (event: Event, ctx: Context) => {
  if (!Object.entries(event).length) {
    if (process.env.SKIP_HOOK && isLambdaHook(event, ctx)) {
      // Expedite deployment even if dependencies are unhealthy.
      return;
    }

    // Run dependency checks otherwise.
    return checkDependencies();
  }

  // Run application logic.
  // ...
};
```

Checks for:

- An empty event object
- A custom `user-agent` in context that starts with `aws-codedeploy-hooks/`

### `smokeTest.koaMiddleware`

A Koa middleware that executes a smoke test function to check whether the application is broadly operational and ready to serve requests.

The `skipHook` option skips synchronous validation of the smoke test function during pre-deployment checks from an AWS CodeDeploy hook.
This may be used when a build needs to be expedited in a disaster recovery scenario or when a dependency is known to be unhealthy.

```typescript
import { Env } from 'skuba-dive';
import Router from '@koa/router';
import logger from '@seek/logger';

const config = {
  skipHook: Env.boolean('SKIP_SMOKE', { default: false }),
};

const logger = createLogger();

export const router = new Router().get(
  '/smoke',
  smokeTest.koaMiddleware({ logger, skipHook: config.skipHook }, async () => {
    // Run dependency checks.
    await checkDependencies();
  }),
);
```

Uses [`isHttpHook`](#ishttphook) under the hood.
