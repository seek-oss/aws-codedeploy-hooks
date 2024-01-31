import type Serverless from 'serverless';
import type Plugin from 'serverless/classes/Plugin';

import { synthLambaDeploymentResources } from './cdk';
import { versionLogicalIdForFunctionLogicalId } from './cfn';

class CodeDeployPlugin implements Plugin {
  constructor(private serverless: Serverless) {}

  hooks: Plugin.Hooks = {
    'after:aws:package:finalize:mergeCustomProviderResources': () => {
      const functionNames = this.serverless.service.getAllFunctionsNames();

      const { getLambdaLogicalId } = this.serverless.getProvider('aws').naming;

      if (!getLambdaLogicalId) {
        throw new Error(
          'Could not access naming.getLambdaLogicalId() helper in Serverless AWS provider',
        );
      }

      const { compiledCloudFormationTemplate } =
        this.serverless.service.provider;

      const serverlessTemplate = {
        // Future proofing in case Serverless internally adopts mappings
        Mappings:
          'Mappings' in compiledCloudFormationTemplate &&
          typeof compiledCloudFormationTemplate.Mappings === 'object'
            ? compiledCloudFormationTemplate.Mappings
            : {},

        Resources: compiledCloudFormationTemplate.Resources,
      };

      const logicalIds = functionNames.map((functionName) => {
        const lambdaFunction = getLambdaLogicalId(functionName);

        const lambdaVersion = versionLogicalIdForFunctionLogicalId(
          serverlessTemplate.Resources,
          lambdaFunction,
        );

        if (!lambdaVersion) {
          throw new Error(
            `Could not find AWS::Lambda::Version corresponding to ${lambdaFunction} AWS::Lambda::Function for ${functionName}`,
          );
        }

        return { lambdaFunction, lambdaVersion };
      });

      const cdkTemplate = synthLambaDeploymentResources({ logicalIds });

      Object.assign(compiledCloudFormationTemplate, {
        Mappings: {
          ...serverlessTemplate.Mappings,
          ...cdkTemplate.Mappings,
        },
        Resources: {
          ...serverlessTemplate.Mappings,
          ...cdkTemplate.Resources,
        },
      });
    },
  };
}

module.exports = CodeDeployPlugin;
