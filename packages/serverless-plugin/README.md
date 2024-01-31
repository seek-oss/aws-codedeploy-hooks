# @seek/aws-codedeploy-serverless-plugin

Serverless plugin that provides equivalent CodeDeploy configuration to the [`LambdaDeployment`] CDK construct.

[`LambdaDeployment`]: ../infra/README.md#lambda-function-cdk

## Design

[`serverless-plugin-canary-deployments`] served as general inspiration for this project,
but it currently does not work with Lambda hooks that are defined externally to the Serverless application stack.
A minimal monkey patch to accept external hooks by function name may look like the following:

```patch
diff --git a/lib/CfTemplateGenerators/Lambda.js b/lib/CfTemplateGenerators/Lambda.js
index 2e3d0a7..96c3729 100644
--- a/lib/CfTemplateGenerators/Lambda.js
+++ b/lib/CfTemplateGenerators/Lambda.js
@@ -5,8 +5,8 @@ function buildUpdatePolicy ({ codeDeployApp, deploymentGroup, afterHook, beforeH
   const updatePolicy = {
     CodeDeployLambdaAliasUpdate: {
       ApplicationName: { Ref: codeDeployApp },
-      AfterAllowTrafficHook: { Ref: afterHook },
-      BeforeAllowTrafficHook: { Ref: beforeHook },
+      AfterAllowTrafficHook: afterHook,
+      BeforeAllowTrafficHook: beforeHook,
       DeploymentGroupName: { Ref: deploymentGroup }
     }
   }
diff --git a/serverless-plugin-canary-deployments.js b/serverless-plugin-canary-deployments.js
index de538e6..65d72d9 100644
--- a/serverless-plugin-canary-deployments.js
+++ b/serverless-plugin-canary-deployments.js
@@ -122,8 +122,8 @@ class ServerlessCanaryDeployments {
     const { alias } = deploymentSettings
     const functionVersion = this.getVersionNameFor(functionName)
     const logicalName = `${functionName}Alias${alias}`
-    const beforeHook = this.getFunctionName(deploymentSettings.preTrafficHook)
-    const afterHook = this.getFunctionName(deploymentSettings.postTrafficHook)
+    const beforeHook = deploymentSettings.preTrafficHook
+    const afterHook = deploymentSettings.postTrafficHook
     const trafficShiftingSettings = {
       codeDeployApp: this.codeDeployAppName,
       deploymentGroup,
```

We could fork the source repository but it's a fair amount of code to maintain.
Given `seek-oss/aws-codedeploy-hooks` already works with the CDK to synthesise CloudFormation resources and abstract CodeDeploy configuration,
it can implement a cut-down Serverless plugin as a thin layer that injects CDK-synthesised resources into the Serverless-compiled CloudFormation template.

At a high level, this process works as follows:

1. Start with a Serverless-compiled CloudFormation template

   ```yaml
   Resources:
     ServerlessFunction:
       Type: AWS::Lambda::Function
   ```

2. Process CDK constructs

   ```yaml
   # 2a. Add placeholder resources

   Resources:
     LambdaFunction123:
       Type: AWS::Lambda::Function

   # 2b. Modify logical IDs

   Resources:
     ServerlessFunction:
       Type: AWS::Lambda::Function

   # 2c. Add CodeDeploy resources

   Resources:
     ServerlessFunction:
       Type: AWS::Lambda::Function

     LambdaFunctionAliasLive123:
       Type: AWS::Lambda::Alias
       Properties:
         FunctionName:
           Ref: ServerlessFunction

   # 2d. Remove placeholder resources

   Resources:
     LambdaFunctionAliasLive123:
       Type: AWS::Lambda::Alias
       Properties:
         FunctionName:
           Ref: ServerlessFunction
   ```

3. Combine Serverless & CDK resources

   ```yaml
   Resources:
     ServerlessFunction:
       Type: AWS::Lambda::Function

     LambdaFunctionAliasLive123:
       Type: AWS::Lambda::Alias
       Properties:
         FunctionName:
           Ref: ServerlessFunction
   ```

The CDK isn't intended to synthesise isolated resources,
so some hackiness is required in defining placeholder constructs for resources that are already compiled by Serverless,
and to then modify [their underlying CloudFormation resources] to ensure dependent constructs will point to the correct resources in the final CloudFormation template.

[`serverless-plugin-canary-deployments`]: https://github.com/davidgf/serverless-plugin-canary-deployments
[their underlying CloudFormation resources]: https://docs.aws.amazon.com/cdk/v2/guide/cfn_layer.html#cfn_layer_resource
