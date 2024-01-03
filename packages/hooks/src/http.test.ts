import { isHttpHook } from './http';

describe('isHttpHook', () => {
  it('is compatible with Request', () =>
    expect(isHttpHook(new Request('https://example.com'))).toBeDefined());

  it('recognises the Gantry hook', () =>
    expect(
      isHttpHook(
        new Request('https://example.com', {
          headers: {
            'User-Agent': 'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3',
          },
        }),
      ),
    ).toBe(true));

  it('recognises the HTTP hook', () =>
    expect(
      isHttpHook(
        new Request('https://example.com', {
          headers: {
            'User-Agent': 'aws-codedeploy-hooks/123',
          },
        }),
      ),
    ).toBe(true));

  it('ignores a different user agent', () =>
    expect(
      isHttpHook(
        new Request('https://example.com', {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }),
      ),
    ).toBe(false));

  it.each(['Mozilla/5.0', null, undefined, true])(
    'ignores a missing user agent',
    () => expect(isHttpHook(new Request('https://example.com'))).toBe(false),
  );
});
