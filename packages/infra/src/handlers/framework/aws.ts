import {
  CodeDeployClient,
  type CodeDeployClientConfig,
} from '@aws-sdk/client-codedeploy';
import { LambdaClient, type LambdaClientConfig } from '@aws-sdk/client-lambda';

import { config } from '../config';

const clientConfig = {
  maxAttempts: 8,
  region: config.region,
} satisfies CodeDeployClientConfig & LambdaClientConfig;

export const codeDeployClient = new CodeDeployClient(clientConfig);

export const lambdaClient = new LambdaClient(clientConfig);
