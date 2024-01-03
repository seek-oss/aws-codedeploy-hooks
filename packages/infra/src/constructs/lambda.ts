import path from 'path';

import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';

export const LAMBDA_HOOK_PROPS: nodejs.NodejsFunctionProps = {
  // Rely on AWS SDK V3 default behaviour of connection reuse.
  awsSdkConnectionReuse: false,

  bundling: {
    externalModules: [
      // Rely on AWS SDK V3 built in to the Lambda runtime.
      '@aws-sdk/*',
    ],
    charset: nodejs.Charset.UTF8,
    format: nodejs.OutputFormat.ESM,
    sourceMap: true,
    target: 'node20',
  },

  entry: path.join(__dirname, '..', 'handlers', 'index.ts'),

  environment: {
    NODE_ENV: 'production',

    // https://nodejs.org/api/cli.html#cli_node_options_options
    NODE_OPTIONS: '--enable-source-maps',
  },

  runtime: lambda.Runtime.NODEJS_20_X,

  timeout: Duration.seconds(300),
};
