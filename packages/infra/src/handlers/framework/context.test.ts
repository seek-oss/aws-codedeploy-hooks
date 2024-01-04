import { setTimeout } from 'timers/promises';

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

  it('enforces a timeout', async () => {
    const task = jest
      .fn()
      .mockImplementation(() =>
        setTimeout(200, undefined, { signal: getAbortSignal() }),
      );

    await expect(
      withTimeout(task, 100),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Task timed out after 100ms: mockConstructor"`,
    );

    expect(task).toHaveBeenCalledTimes(1);

    await expect(
      task.mock.results[0]!.value,
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"The operation was aborted"`);
  });
});
