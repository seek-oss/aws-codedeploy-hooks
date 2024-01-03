describe('config', () => {
  it('throws an error if all environment variables are not set', () => {
    process.env = {};

    expect(() => require('./config')).toThrowErrorMatchingInlineSnapshot(
      `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_LAMBDA_FUNCTION_NAME, AWS_REGION, AWS_LAMBDA_FUNCTION_VERSION"`,
    );
  });

  it('throws an error if some environment variables are not set', () => {
    process.env = {
      AWS_LAMBDA_FUNCTION_NAME: 'aws-codedeploy-hook-LifecycleEvent',
      AWS_LAMBDA_FUNCTION_VERSION: 'local',
    };

    expect(() => require('./config')).toThrowErrorMatchingInlineSnapshot(
      `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_REGION"`,
    );
  });
});
