# @seek/aws-codedeploy-hooks

## 3.0.0

### Major Changes

- Require Node.js 22.14.0+ ([#209](https://github.com/seek-oss/aws-codedeploy-hooks/pull/209))

### Patch Changes

- Allow for passing lowercase `custom` field in `clientContext` ([#207](https://github.com/seek-oss/aws-codedeploy-hooks/pull/207))

## 2.0.0

### Major Changes

- Drop support for Node.js 18 ([#140](https://github.com/seek-oss/aws-codedeploy-hooks/pull/140))

  This aligns with [`@seek/logger` 10](https://github.com/seek-oss/logger/releases/v10.0.0). The minimum supported version is now Node.js 20.9.0.

## 1.2.0

### Minor Changes

- **containsSkipDirective:** Add function ([#58](https://github.com/seek-oss/aws-codedeploy-hooks/pull/58))

### Patch Changes

- Fix discrepancies with user-agent values vs. expectations ([#58](https://github.com/seek-oss/aws-codedeploy-hooks/pull/58))

## 1.1.0

### Minor Changes

- **smokeTest.koaMiddleware:** Add function ([#33](https://github.com/seek-oss/aws-codedeploy-hooks/pull/33))

### Patch Changes

- **isHttpHook:** Support Koa `ctx.req` ([#30](https://github.com/seek-oss/aws-codedeploy-hooks/pull/30))

## 1.0.1

### Patch Changes

- **docs:** Add usage section to README ([#20](https://github.com/seek-oss/aws-codedeploy-hooks/pull/20))

## 1.0.0

### Major Changes

- **isHttpHook:** Add function ([#7](https://github.com/seek-oss/aws-codedeploy-hooks/pull/7))

- **isLambdaHook:** Add function ([#7](https://github.com/seek-oss/aws-codedeploy-hooks/pull/7))
