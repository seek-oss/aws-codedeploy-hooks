import { AsyncLocalStorage } from 'async_hooks';

type Context = {
  abortSignal?: AbortSignal;
  requestId?: string;
};

export const storage = new AsyncLocalStorage<Context>();

export const getContext = (): Context => storage.getStore() ?? {};

export const getAbortSignal = () => storage.getStore()?.abortSignal;

export const getRequestId = () => storage.getStore()?.requestId;

export const withTimeout = async <T>(
  task: () => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const parent = getAbortSignal();

  const timeout = AbortSignal.timeout(timeoutMs);

  const abortSignal = parent
    ? // @ts-expect-error: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60868
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (AbortSignal.any([parent, timeout]) as AbortSignal)
    : timeout;

  return storage.run({ ...getContext(), abortSignal }, task);
};
