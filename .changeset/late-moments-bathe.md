---
'@seek/aws-codedeploy-infra': patch
---

Fix a bug in the `BeforeAllowTraffic` hook that was causing it to retrieve metadata from itself instead of the target Lambda function being deployed.

The hook now correctly fetches metadata from the target function, which allows the deployment to proceed and populates the service field in hook logs with the target function's name.
