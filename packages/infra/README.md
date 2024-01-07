# @seek/aws-codedeploy-infra

[AWS CDK] infrastructure for AWS CodeDeploy Hooks.

This is compatible with:

- serverless-canary-deployment-plugin

Consolidates hook implementations across a networking environment rather than deploying them per service.
You can define in-stack hooks per application,
but this becomes wasteful and boilerplate-y.

[AWS CDK]: https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html
