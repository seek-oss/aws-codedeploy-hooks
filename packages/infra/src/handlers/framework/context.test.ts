import { setTimeout } from 'timers/promises';
import { inspect } from 'util';

import {
  getAbortSignal,
  getContext,
  storage,
  updateTargetLambdaMetadata,
  withTimeout,
} from './context.js';

const context = {
  abortSignal: new AbortController().signal,
  invocation: {
    deploymentId: 'mock-deployment-id',
    requestId: 'mock-request-id',
  },
};

describe('getAbortSignal', () => {
  it('returns the current abort signal where available', () =>
    storage.run(context, () =>
      expect(getAbortSignal()).toBe(context.abortSignal),
    ));
});

describe('getContext', () => {
  it('returns the current context where available', () =>
    storage.run(context, () => expect(getContext()).toStrictEqual(context)));

  it('returns a placeholder object if there is no context', () =>
    expect(getContext()).toStrictEqual({invocation:{}}));
});

describe('withTimeout', () => {
  it('returns task result on happy path', async () => {
    const result = 'mock-result';

    const task = jest.fn().mockResolvedValue(result);

    await expect(withTimeout(task, 100)).resolves.toBe(result);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('returns task result on happy path with a dormant parent signal', async () => {
    const result = 'mock-result';

    const task = jest.fn().mockResolvedValue(result);

    await expect(
      storage.run(
        { abortSignal: new AbortController().signal, invocation: {} },
        () => withTimeout(task, 100),
      ),
    ).resolves.toBe(result);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('enforces a timeout', async () => {
    const task = jest
      .fn()
      .mockImplementation(() =>
        setTimeout(200, undefined, { signal: getAbortSignal() }),
      );

    await expect(withTimeout(task, 100)).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "The operation was aborted
      Cause: The operation was aborted due to timeout"
    `);

    await expect(
      task.mock.results[0]!.value.catch((err: unknown) =>
        inspect(err)
          .replaceAll(/\s+at [^\r\n]+/g, '\n')
          .replaceAll(/[\r\n]+/g, '\n'),
      ),
    ).resolves.toMatchInlineSnapshot(`
      "AbortError: The operation was aborted
        code: 'ABORT_ERR',
        [cause]: DOMException [TimeoutError]: The operation was aborted due to timeout
      }"
    `);
  });

  const TEST_TIMEOUT_MS = 5_000;
  it(
    'propagates a parent signal abortion',
    async () => {
      const task = jest
        .fn()
        .mockImplementation(() =>
          setTimeout(200, undefined, { signal: getAbortSignal() }),
        );

      // This will time out
      const abortSignal = AbortSignal.timeout(100);

      await expect(
        storage.run({ abortSignal, invocation: {} }, () =>
          // This won't time out
          withTimeout(task, TEST_TIMEOUT_MS + 1_000),
        ),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
        "The operation was aborted
        Cause: The operation was aborted due to timeout"
      `);
    },
    TEST_TIMEOUT_MS,
  );
});

describe('updateTargetLambdaMetadata', () => {
  it('updates the targetLambdaService in context based on Lambda metadata', () => {
    const lambdaMetaData = {
      Configuration: {
        FunctionName: 'my-function',
        Environment: {
          Variables: {
            DD_SERVICE: 'my-service',
          },
        },
      },
      Tags: {
        service: 'my-tagged-service',
      },
      $metadata: {},
    };

    storage.run({ invocation: {} }, () => {
      updateTargetLambdaMetadata(lambdaMetaData);

      expect(getContext().invocation.targetLambdaService).toBe(
        'my-tagged-service',
      );
    });
  });

  it('falls back to DD_SERVICE env var when service tag is not present', () => {
    const lambdaMetaData = {
      Configuration: {
        FunctionName: 'my-function',
        Environment: {
          Variables: {
            DD_SERVICE: 'my-service',
          },
        },
      },
      Tags: {},
      $metadata: {},
    };

    storage.run({ invocation: {} }, () => {
      updateTargetLambdaMetadata(lambdaMetaData);

      expect(getContext().invocation.targetLambdaService).toBe('my-service');
    });
  });

  it('falls back to function name when neither service tag nor DD_SERVICE env var are present', () => {
    const lambdaMetaData = {
      Configuration: {
        FunctionName: 'my-function',
        Environment: {
          Variables: {},
        },
      },
      Tags: {},
      $metadata: {},
    };

    storage.run({ invocation: {} }, () => {
      updateTargetLambdaMetadata(lambdaMetaData);

      expect(getContext().invocation.targetLambdaService).toBe('my-function');
    });
  });

  it('does not throw if context is not available', () => {
    const lambdaMetaData = {
      Configuration: {
        FunctionName: 'my-function',
        Environment: {
          Variables: {},
        },
      },
      Tags: {},
      $metadata: {},
    };

    expect(() => updateTargetLambdaMetadata(lambdaMetaData)).not.toThrow();
  });
});
