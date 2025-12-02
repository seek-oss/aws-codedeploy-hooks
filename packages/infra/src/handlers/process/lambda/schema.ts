import * as z from 'zod';

export const lambdaFunctionProperties = z.object({
  Name: z.string(),
  Alias: z.string(),
  CurrentVersion: z.string(),
  TargetVersion: z.string(),
});

export type LambdaFunctionProperties = z.infer<typeof lambdaFunctionProperties>;

/**
 * https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-example.html#appspec-file-example-lambda
 */
export const lambdaAppSpec = z.object({
  version: z.literal('0.0'),

  /**
   * https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-resources.html#reference-appspec-file-structure-resources-lambda
   */
  Resources: z
    .record(
      z.string(),
      z.object({
        Type: z.literal('AWS::Lambda::Function'),
        Properties: lambdaFunctionProperties,
      }),
    )
    .array()
    .min(1),

  /**
   * https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html#reference-appspec-file-structure-hooks-list-lambda
   */
  Hooks: z
    .object({
      BeforeAllowTraffic: z.string().optional(),
      AfterAllowTraffic: z.string().optional(),
    })
    .array()
    .min(1),
});

export type LambdaAppSpec = z.infer<typeof lambdaAppSpec>;
