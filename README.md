# AWS CodeDeploy Hooks

[![Release](https://github.com/seek-oss/aws-codedeploy-hooks/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/seek-oss/aws-codedeploy-hooks/actions/workflows/release.yml)
[![Validate](https://github.com/seek-oss/aws-codedeploy-hooks/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/seek-oss/aws-codedeploy-hooks/actions/workflows/validate.yml)

[AWS CodeDeploy] is a deployment mechanism for ECS services, Lambda functions, and more.

The service includes a feature called [lifecycle event hooks],
which lets you invoke user-defined code to perform checks at different phases of the deployment.
For example, you could check that the new version of your application is responding successfully on its health check endpoint before allowing traffic to shift in a [blue-green deployment].

This repository houses TypeScript packages that help you integrate CodeDeploy hooks into your deployments:

- [@seek/aws-codedeploy-hooks](packages/hooks)

  Runtime helpers to identify requests originating from a hook.
  This enables you to customise application logic accordingly.

- [@seek/aws-codedeploy-infra](packages/infra)

  CDK helpers to deploy lifecycle event hooks and configure CodeDeploy for your Lambda functions.

[AWS CodeDeploy]: https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html
[blue-green deployment]: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html
[lifecycle event hooks]: https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html
