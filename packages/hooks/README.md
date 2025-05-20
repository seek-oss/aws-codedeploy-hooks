# @seek/aws-codedeploy-hooks

[![npm package](https://img.shields.io/npm/v/@seek/aws-codedeploy-hooks?labelColor=cb0000&color=5b5b5b)](https://www.npmjs.com/package/@seek/aws-codedeploy-hooks)
[![Node.js version](https://img.shields.io/node/v/@seek/aws-codedeploy-hooks?labelColor=5fa04e&color=5b5b5b)](https://www.npmjs.com/package/@seek/aws-codedeploy-hooks)

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
  if (process.env.SKIP_SMOKE && isHttpHook(req)) {
    // Expedite deployment even if dependencies are unhealthy.
    return;
  }

  // Run dependency checks otherwise.
  return checkDependencies();
};
```

Checks for a `user-agent` header that starts with either:

- `aws-codedeploy-hook-BeforeAllowTraffic/`
- `gantry-codedeploy-hook-BeforeAllowTraffic-`

Compatible with Gantry v2.3.7 and newer.

`SKIP_SMOKE` will require additional setup. Consider setting the environment variable on your API based on the surrounding CI environment,
like the build message or an explicit environment variable against the build.

For example, your Gantry resource file could look like this:

```yaml
kind: Service
env:
  SKIP_SMOKE: '{{ with env "BUILDKITE_MESSAGE" | lower }}{{ if contains "[skip smoke]" . }}true{{ else }}false{{ end }}{{ end }}'
```

Or, some magic to handle combinations like `[skip ci dev-deploy smoke]`:

```yaml
kind: Service
env:
  SKIP_SMOKE: '{{ with env "BUILDKITE_MESSAGE" | lower }}{{ if regexMatch "\\[skip\\b[^\\]]*\\bsmoke\\b[^\\]]*\\]" . }}true{{ else }}false{{ end }}{{ end }}'
```

With these in place,
you can push a new commit or manually create a new build that includes `[skip smoke]` somewhere in its title:

```yaml
[skip smoke] Re-deploy for disaster recovery
Re-deploy for disaster recovery [sKiP SmOkE]

# you can also work with multiple directives if you chose the magic approach
[skip ci smoke] Re-deploy for disaster recovery
Please [skip smoke dev-deploy] work
```

The resulting Buildkite build will set `process.env.SKIP_SMOKE = true` on the ECS task and enable it to skip pre-deployment checks.

### `isLambdaHook`

Whether the Lambda invocation originated from AWS CodeDeploy Hooks.

This can be used to customise smoke test handling.
When recovering a system with unhealthy dependencies,
it may be desirable to expedite recovery efforts by skipping pre-deployment checks,
while continuing to run the checks as per usual on subsequent health check polling.

```typescript
const handler = (event: Event, ctx: Context) => {
  if (!Object.entries(event).length) {
    if (process.env.SKIP_SMOKE && isLambdaHook(event, ctx)) {
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
- A custom `user-agent` in context that starts with `aws-codedeploy-hook-BeforeAllowTraffic/`

`SKIP_SMOKE` will require additional setup. Consider setting the environment variable on your Lambda function based on the surrounding CI environment:

```typescript
import { containsSkipDirective } from '@seek/aws-codedeploy-hooks';

const lambdaEnvironment = {
  SKIP_SMOKE: containsSkipDirective(process.env.BUILDKITE_MESSAGE, 'smoke')
    ? 'true'
    : undefined,
  // ... other environment variables
};
```

With this in place,
you can push a new commit or manually create a new build that includes `[skip smoke]` somewhere in its title:

```yaml
[skip smoke] Re-deploy for disaster recovery
Re-deploy for disaster recovery [sKiP SmOkE]

# you can also work with multiple directives
[skip ci smoke] Re-deploy for disaster recovery
Please [skip smoke dev-deploy] work
```

The resulting Buildkite build will set `process.env.SKIP_SMOKE = true` on the Lambda function and enable it to skip pre-deployment checks.

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
