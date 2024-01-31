import { z } from 'zod';

type Resources = z.infer<typeof templateSchema>['Resources'];

export const templateSchema = z.object({
  Mappings: z.record(z.unknown(), z.string()),
  Resources: z.record(z.object({ Type: z.string() }).passthrough(), z.string()),
});

export const versionLogicalIdForFunctionLogicalId = (
  resources: Resources,
  functionLogicalId: string,
) => {
  const schema = versionResourceSchema(functionLogicalId);

  return Object.entries(resources).find(
    ([, resource]) => schema.safeParse(resource).success,
  )?.[0];
};

const versionResourceSchema = <T extends string>(functionLogicalId: T) =>
  z.object({
    Type: z.literal('AWS::Lambda::Version'),
    Properties: z.object({
      FunctionName: z.object({
        Ref: z.literal(functionLogicalId),
      }),
    }),
  });
