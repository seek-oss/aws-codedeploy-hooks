---
'@seek/aws-codedeploy-infra': minor
---

Enhanced logging added Datadog integration:

- Logger now dynamically resolves `service` field from Lambda function metadata, prioritizing `Tags.service`, then `DD_SERVICE` environment variable, falling back to the function name or a default of `aws-codedeploy-hooks`
- Set [Datadog log tier](https://github.com/seek-oss/logger/blob/master/docs/eeeoh.md#datadog-log-tiers) to `tin`
- Set [logger.name](https://docs.datadoghq.com/standard-attributes/?search=logger) to `aws-codedeploy-hooks`
