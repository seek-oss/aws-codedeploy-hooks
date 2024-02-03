import { diff } from 'jest-diff';

import { redirectEventSourceMappings } from './cfn';
import { eventSourceMappings } from './testing/lambda';

test('redirectEventSourceMappings', () => {
  const input = eventSourceMappings;

  const output = structuredClone(input);

  redirectEventSourceMappings(output, [
    'WorkerALambdaFunction',
    'WorkerBLambdaFunction',
  ]);

  const result = diff(input, output, {
    aColor: (s) => s,
    bColor: (s) => s,
    changeColor: (s) => s,
    commonColor: (s) => s,
    patchColor: (s) => s,

    contextLines: 3,
    expand: false,
    omitAnnotationLines: true,
  });

  expect(result).toMatchInlineSnapshot(`
"@@ -43,7 +43,7 @@
          ],
        },
        "FunctionName": Object {
-         "Ref": "WorkerALambdaFunction",
+         "Ref": "WorkerALambdaFunctionAliasLive",
        },
      },
      "Type": "AWS::Lambda::EventSourceMapping",
@@ -62,7 +62,7 @@
          ],
        },
        "FunctionName": Object {
-         "Ref": "WorkerBLambdaFunction",
+         "Ref": "WorkerBLambdaFunctionAliasLive",
        },
      },
      "Type": "AWS::Lambda::EventSourceMapping",
@@ -81,7 +81,7 @@
          ],
        },
        "FunctionName": Object {
-         "Ref": "WorkerALambdaFunction",
+         "Ref": "WorkerALambdaFunctionAliasLive",
        },
      },
      "Type": "AWS::Lambda::EventSourceMapping","
`);
});
