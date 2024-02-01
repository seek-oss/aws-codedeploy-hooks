import { z } from 'zod';

type Resources = z.infer<typeof templateSchema>['Resources'];

export const templateSchema = z.object({
  Mappings: z.record(z.unknown(), z.string()),
  Resources: z.record(z.object({ Type: z.string() }).passthrough(), z.string()),
});

type LambdaResourceType =
  | 'AWS::Lambda::Alias'
  | 'AWS::Lambda::EventSourceMapping'
  | 'AWS::Lambda::Version';

const createResourceSchema = <T extends LambdaResourceType, Id extends string>(
  type: T,
  functionLogicalId: Id,
) =>
  z
    .object({
      Type: z.literal(type),
      Properties: z
        .object({
          FunctionName: z.object({
            Ref: z.literal(functionLogicalId),
          }),
        })
        .passthrough(),
    })
    .passthrough();

export const logicalIdForFunctionLogicalId = (
  resourceType: LambdaResourceType,
  resources: Resources,
  functionLogicalId: string,
) => {
  const schema = createResourceSchema(resourceType, functionLogicalId);

  return Object.entries(resources).find(
    ([, resource]) => schema.safeParse(resource).success,
  )?.[0];
};

export const redirectEventSourceMappings = (
  resources: Resources,
  functionLogicalIds: string[],
): void => {
  for (const functionLogicalId of functionLogicalIds) {
    const alias = logicalIdForFunctionLogicalId(
      'AWS::Lambda::Alias',
      resources,
      functionLogicalId,
    );

    if (!alias) {
      throw new Error(
        `Could not find AWS::Lambda::Alias corresponding to ${functionLogicalId} AWS::Lambda::Function`,
      );
    }

    const schema = createResourceSchema(
      'AWS::Lambda::EventSourceMapping',
      functionLogicalId,
    );

    for (const [logicalId, resource] of Object.entries(resources)) {
      const parsed = schema.safeParse(resource);

      if (parsed.success) {
        parsed.data.Properties.FunctionName.Ref = alias;

        resources[logicalId] = parsed.data;
      }
    }
  }
};
