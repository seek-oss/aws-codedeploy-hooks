import { AsyncLocalStorage } from 'async_hooks';

import type { GetFunctionCommandOutput } from '@aws-sdk/client-lambda';

type Context = {
  abortSignal?: AbortSignal;
  invocation: {
    requestId?: string;
    deploymentId?: string;
    targetLambdaService?: string;
  };
};

export const storage = new AsyncLocalStorage<Context>();

export const getContext = (): Context =>
  storage.getStore() ?? { invocation: {} };

export const getAbortSignal = () => storage.getStore()?.abortSignal;

export const updateTargetLambdaMetadata = (
  targetLambdaMetadata: GetFunctionCommandOutput,
): void => {
  const store = storage.getStore();
  if (store) {
    store.invocation.targetLambdaService =
      targetLambdaMetadata.Tags?.service ??
      targetLambdaMetadata.Configuration?.Environment?.Variables?.DD_SERVICE ??
      targetLambdaMetadata.Configuration?.FunctionName;
  }
};

export const withTimeout = async <T>(
  task: () => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const parent = getAbortSignal();

  const timeout = AbortSignal.timeout(timeoutMs);

  const abortSignal = parent ? AbortSignal.any([parent, timeout]) : timeout;

  return storage.run(
    { invocation: getContext().invocation, abortSignal },
    task,
  );
};
