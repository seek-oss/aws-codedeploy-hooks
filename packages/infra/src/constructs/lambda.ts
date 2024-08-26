import path from 'path';

import { Duration, aws_lambda, type aws_lambda_nodejs } from 'aws-cdk-lib';

export const createLambdaHookProps = (
  environment: Record<string, string>,
): aws_lambda_nodejs.NodejsFunctionProps => ({
  architecture: aws_lambda.Architecture.ARM_64,

  code: aws_lambda.Code.fromAsset(
    path.join(__dirname, '..', 'assets', 'handlers'),
  ),

  environment: {
    ...environment,

    NODE_ENV: 'production',

    // https://nodejs.org/api/cli.html#cli_node_options_options
    NODE_OPTIONS: '--enable-source-maps',
  },

  bundling: {
    sourceMap: true,
    target: 'node20',
    // aws-sdk-v3 is set as an external module by default, but we want it to be bundled with the function
    externalModules: [],
  },

  handler: 'index.handler',

  runtime: aws_lambda.Runtime.NODEJS_20_X,

  timeout: Duration.seconds(300),
});
