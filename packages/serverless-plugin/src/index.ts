/* eslint-disable no-console */

import type Serverless from 'serverless';
import type Plugin from 'serverless/classes/Plugin';

import { synthLambaDeploymentResources } from './cdk';

class CodeDeployPlugin implements Plugin {
  constructor(private serverless: Serverless) {}

  hooks: Plugin.Hooks = {
    'after:aws:package:finalize:mergeCustomProviderResources': () => {
      const functionNames = this.serverless.service.getAllFunctionsNames();

      const { getLambdaLogicalId } = this.serverless.getProvider('aws').naming;

      if (!getLambdaLogicalId) {
        throw new Error('Badness!');
      }

      const logicalIds = functionNames.map((functionName) => ({
        lambdaFunction: getLambdaLogicalId(functionName),
        lambdaVersion: 'TODO',
      }));

      const { Mappings, Resources } = synthLambaDeploymentResources({
        logicalIds,
      });

      Object.assign(
        this.serverless.service.provider.compiledCloudFormationTemplate,
        {
          Mappings,
          Resources: {
            ...this.serverless.service.provider.compiledCloudFormationTemplate
              .Resources,
            ...Resources,
          },
        },
      );
    },
  };
}

module.exports = CodeDeployPlugin;
