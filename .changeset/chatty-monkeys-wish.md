---
'@seek/aws-codedeploy-infra': patch
---

HookStack: Bundle handlers with rolldown

This fixes the following `Init Error` in the hooks:

```json
{
  "errorType": "Error",
  "errorMessage": "Dynamic require of \"node:os\" is not supported",
  "stack": [
    "Error: Dynamic require of \"node:os\" is not supported",
    "    at file:///var/task/index.mjs:11:9",
    "    at ../../node_modules/.pnpm/pino@10.3.1/node_modules/pino/pino.js (/node_modules/.pnpm/pino@10.3.1/node_modules/pino/pino.js:3:12)"
  ]
}
```
