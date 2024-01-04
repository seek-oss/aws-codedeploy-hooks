import { AsyncLocalStorage } from 'async_hooks';
import { setTimeout } from 'timers/promises';

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
  const cancelTask = new AbortController();
  const cancelTimeout = new AbortController();

  const runTask = async (): Promise<T> => {
    try {
      return await storage.run(
        { ...getContext(), abortSignal: cancelTask.signal },
        task,
      );
    } finally {
      cancelTimeout.abort();
    }
  };

  const runTimeout = async (): Promise<never> => {
    await setTimeout(timeoutMs, undefined, { signal: cancelTimeout.signal });

    cancelTask.abort();

    throw new Error(`Task timed out after ${timeoutMs}ms: ${task.name}`);
  };

  return Promise.race([runTask(), runTimeout()]);
};
