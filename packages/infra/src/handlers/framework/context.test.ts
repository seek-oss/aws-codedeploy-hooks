import { getAbortSignal, getContext, getRequestId, storage } from './context';

const context = {
  abortSignal: new AbortController().signal,
  requestId: 'mock-request-id',
};

describe('getAbortSignal', () => {
  it('returns the current abort signal where available', () =>
    storage.run(context, () =>
      expect(getAbortSignal()).toEqual(context.abortSignal),
    ));
});

describe('getContext', () => {
  it('returns the current context where available', () =>
    storage.run(context, () => expect(getContext()).toEqual(context)));

  it('returns an empty object if there is no context', () =>
    expect(getContext()).toEqual({}));
});

describe('getRequestId', () => {
  it('returns the current request ID where available', () =>
    storage.run(context, () =>
      expect(getRequestId()).toEqual(context.requestId),
    ));
});
