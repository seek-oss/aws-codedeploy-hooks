import path from 'path';

import { Duration, aws_lambda } from 'aws-cdk-lib';

export const createLambdaHookProps = (
  environment: Record<string, string>,
): aws_lambda.FunctionProps => ({
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

  handler: 'index.handler',

  runtime: aws_lambda.Runtime.NODEJS_22_X,

  timeout: Duration.seconds(300),
});
