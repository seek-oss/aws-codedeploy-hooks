import { CodeDeployClient } from '@aws-sdk/client-codedeploy';

import { config } from '../config';

const clientConfig = {
  maxAttempts: 5,
  region: config.region,
};

export const codeDeployClient = new CodeDeployClient(clientConfig);
