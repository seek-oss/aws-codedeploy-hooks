import { CodeDeployClient } from '@aws-sdk/client-codedeploy';
import { LambdaClient } from '@aws-sdk/client-lambda';

import { config } from '../config';

const clientConfig = {
  maxAttempts: 5,
  region: config.region,
};

export const codeDeployClient = new CodeDeployClient(clientConfig);

export const lambdaClient = new LambdaClient(clientConfig);
