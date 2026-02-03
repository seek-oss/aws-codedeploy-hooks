# @seek/aws-codedeploy-infra

## 4.0.1

### Patch Changes

- Fix BeforeAllowTraffic permissions ([#213](https://github.com/seek-oss/aws-codedeploy-hooks/pull/213))
  Add [standard attributes](https://docs.datadoghq.com/standard-attributes/?search=logger) to logs

## 4.0.0

### Major Changes

- Require Node.js 22.14.0+ ([#209](https://github.com/seek-oss/aws-codedeploy-hooks/pull/209))

### Minor Changes

- **HookStack:** Upgrade hooks to Node.js 24 ([#209](https://github.com/seek-oss/aws-codedeploy-hooks/pull/209))

- Enhanced logging and added Datadog integration: ([#200](https://github.com/seek-oss/aws-codedeploy-hooks/pull/200))
  - Logger now dynamically resolves `service` field from Lambda function metadata, prioritizing `Tags.service`, then `DD_SERVICE` environment variable, falling back to the function name or a default of `aws-codedeploy-hooks`
  - Set [Datadog log tier](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#datadog-log-tiers) to `tin`
  - Set [logger.name](https://docs.datadoghq.com/standard-attributes/?search=logger) to `aws-codedeploy-hooks`

### Patch Changes

- **deps:** @seek/logger ^11.0.0 ([#158](https://github.com/seek-oss/aws-codedeploy-hooks/pull/158))

- Include `ddsource` in hook logs ([#166](https://github.com/seek-oss/aws-codedeploy-hooks/pull/166))

- **deps:** skuba-dive ^3.0.0 ([#197](https://github.com/seek-oss/aws-codedeploy-hooks/pull/197))

## 3.1.0

### Minor Changes

- Enhance logs with additional context ([#154](https://github.com/seek-oss/aws-codedeploy-hooks/pull/154))

### Patch Changes

- **deps:** zod ^4.0.0 ([#147](https://github.com/seek-oss/aws-codedeploy-hooks/pull/147))

## 3.0.0

### Major Changes

- Drop support for Node.js 18 ([#140](https://github.com/seek-oss/aws-codedeploy-hooks/pull/140))

  This aligns with [`@seek/logger` 10](https://github.com/seek-oss/logger/releases/v10.0.0). The minimum supported version is now Node.js 20.9.0.

### Patch Changes

- **deps:** `@seek/logger` 10 ([#140](https://github.com/seek-oss/aws-codedeploy-hooks/pull/140))

## 2.3.0

### Minor Changes

- **HookStack:** extend `HookStackProps` from `StackProps` ([#128](https://github.com/seek-oss/aws-codedeploy-hooks/pull/128))

## 2.2.0

### Minor Changes

- **HookStack:** Upgrade hooks to Node.js 22 ([#104](https://github.com/seek-oss/aws-codedeploy-hooks/pull/104))

## 2.1.4

### Patch Changes

- **HookStack:** Increase AWS SDK retries ([#95](https://github.com/seek-oss/aws-codedeploy-hooks/pull/95))

## 2.1.3

### Patch Changes

- **HookStack:** Improve logging on Lambda function errors ([#81](https://github.com/seek-oss/aws-codedeploy-hooks/pull/81))

  When the `BeforeAllowTraffic` hook invokes your Lambda function and receives a `FunctionError` back, it now logs additional information from the response payload to aid troubleshooting:

  ```diff
  {
    "err": {
      "message": "Lambda function responded with error: Unhandled",
  +   "payload": {
  +     "errorMessage": "RequestId: 00000000-0000-0000-0000-000000000000 Error: Task timed out after 1.00 seconds",
  +     "errorType": "Sandbox.Timedout"
  +   },
      "stack": "Error: Lambda function responded with error: Unhandled...",
      "type": "Error"
    },
    "level": 50,
    "msg": "Failed to process lifecycle event"
  }
  ```

## 2.1.2

### Patch Changes

- **deps:** @seek/logger ^9.0.0 ([#67](https://github.com/seek-oss/aws-codedeploy-hooks/pull/67))

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
