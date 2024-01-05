import { setTimeout } from 'timers/promises';
import { inspect } from 'util';

import {
  getAbortSignal,
  getContext,
  getRequestId,
  storage,
  withTimeout,
} from './context';

const context = {
  abortSignal: new AbortController().signal,
  requestId: 'mock-request-id',
};

describe('getAbortSignal', () => {
  it('returns the current abort signal where available', () =>
    storage.run(context, () =>
      expect(getAbortSignal()).toStrictEqual(context.abortSignal),
    ));
});

describe('getContext', () => {
  it('returns the current context where available', () =>
    storage.run(context, () => expect(getContext()).toStrictEqual(context)));

  it('returns an empty object if there is no context', () =>
    expect(getContext()).toStrictEqual({}));
});

describe('getRequestId', () => {
  it('returns the current request ID where available', () =>
    storage.run(context, () =>
      expect(getRequestId()).toStrictEqual(context.requestId),
    ));
});

describe('withTimeout', () => {
  it('returns task result on happy path', async () => {
    const result = 'mock-result';

    const task = jest.fn().mockResolvedValue(result);

    await expect(withTimeout(task, 100)).resolves.toStrictEqual(result);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('returns task result on happy path with a dormant parent signal', async () => {
    const result = 'mock-result';

    const task = jest.fn().mockResolvedValue(result);

    await expect(
      storage.run({ abortSignal: new AbortController().signal }, () =>
        withTimeout(task, 100),
      ),
    ).resolves.toStrictEqual(result);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('enforces a timeout', async () => {
    const task = jest
      .fn()
      .mockImplementation(() =>
        setTimeout(200, undefined, { signal: getAbortSignal() }),
      );

    await expect(
      withTimeout(task, 100),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"The operation was aborted"`);

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
        storage.run({ abortSignal }, () =>
          // This won't time out
          withTimeout(task, TEST_TIMEOUT_MS + 1_000),
        ),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The operation was aborted"`,
      );
    },
    TEST_TIMEOUT_MS,
  );
});
