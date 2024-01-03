import { AsyncLocalStorage } from 'async_hooks';

type Context = {
  abortSignal?: AbortSignal;
  requestId?: string;
};

export const storage = new AsyncLocalStorage<Context>();

export const getContext = (): Context => storage.getStore() ?? {};

export const getAbortSignal = () => storage.getStore()?.abortSignal;

export const getRequestId = () => storage.getStore()?.requestId;
