const {
  AWS_DEFAULT_REGION,
  AWS_LAMBDA_FUNCTION_NAME,
  AWS_LAMBDA_FUNCTION_VERSION,
  AWS_REGION,
} = process.env;

const region = AWS_REGION ?? AWS_DEFAULT_REGION;

if (!AWS_LAMBDA_FUNCTION_NAME || !AWS_LAMBDA_FUNCTION_VERSION || !region) {
  const unsetVariables = Object.entries({
    AWS_DEFAULT_REGION,
    AWS_LAMBDA_FUNCTION_NAME,
    AWS_REGION,
    AWS_LAMBDA_FUNCTION_VERSION,
  })
    .flatMap(([key, value]) => (value ? [] : key))
    .join(', ');

  throw new Error(
    `The following environment variables are not set: ${unsetVariables}`,
  );
}

// TODO: should we include build number / commit hash / npm package version?
const userAgent = `${AWS_LAMBDA_FUNCTION_NAME}/${AWS_LAMBDA_FUNCTION_VERSION}`;

const environment =
  process.env.ENVIRONMENT === 'local' || process.env.ENVIRONMENT === 'test'
    ? process.env.ENVIRONMENT
    : 'production';

export const config = {
  functionName: AWS_LAMBDA_FUNCTION_NAME,
  environment,
  region,
  userAgent,
} as const satisfies Record<string, string>;
