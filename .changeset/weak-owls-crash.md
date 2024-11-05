---
'@seek/aws-codedeploy-infra': patch
---

HookStack: Improve logging on Lambda function errors

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
