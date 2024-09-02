# @seek/aws-codedeploy-infra

## 2.1.1

### Patch Changes

- **HookStack:** fix `clientContext` structure mistake which was preventing `isLambdaHook` from ever returning `true` ([#58](https://github.com/seek-oss/aws-codedeploy-hooks/pull/58))

- Fix discrepancies with user-agent values vs. expectations ([#58](https://github.com/seek-oss/aws-codedeploy-hooks/pull/58))

## 2.1.0

### Minor Changes

- **HookStack:** Implement version prune in AfterAllowTraffic ([#57](https://github.com/seek-oss/aws-codedeploy-hooks/pull/57))

## 2.0.0

### Major Changes

- **deps:** @seek/logger ^8.0.0 ([#45](https://github.com/seek-oss/aws-codedeploy-hooks/pull/45))

  Our minimum Node.js version is now 18.18.

## 1.1.0

### Minor Changes

- **HookStack:** Switch hook to ARM ([#41](https://github.com/seek-oss/aws-codedeploy-hooks/pull/41))

## 1.0.2

### Patch Changes

- **docs:** Fix package metadata ([#37](https://github.com/seek-oss/aws-codedeploy-hooks/pull/37))

## 1.0.1

### Patch Changes

- **HookStack:** Allow multiple instances ([#31](https://github.com/seek-oss/aws-codedeploy-hooks/pull/31))

## 1.0.0

### Major Changes

- **LambdaDeployment:** Add construct ([#26](https://github.com/seek-oss/aws-codedeploy-hooks/pull/26))

- **HookStack:** Add construct ([#26](https://github.com/seek-oss/aws-codedeploy-hooks/pull/26))
