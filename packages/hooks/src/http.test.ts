import Koa from 'koa';
import { agent } from 'supertest';

import { isHttpHook } from './http';

describe('isHttpHook', () => {
  it('is compatible with Request', () =>
    expect(isHttpHook(new Request('https://example.com'))).toBeDefined());

  it('is compatible with Koa', () => {
    const app = new Koa().use((ctx) => {
      ctx.body = [
        isHttpHook(ctx.req),
        isHttpHook(ctx.request),
        isHttpHook(ctx.request.req),
      ];
    });

    return agent(app.callback())
      .get('/')
      .set('User-Agent', 'gantry-codedeploy-hook-BeforeAllowTraffic-dev/1.2.3')
      .expect(200, [true, true, true]);
  });

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
            'User-Agent': 'aws-codedeploy-hook-BeforeAllowTraffic/123',
          },
        }),
      ),
    ).toBe(true));

  it('recognises one of multiple user agents', () =>
    expect(
      isHttpHook({
        headers: {
          'user-agent': [
            'rogue-agent',
            'aws-codedeploy-hook-BeforeAllowTraffic/123',
            'secret-agent',
          ],
        },
      }),
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

  it('ignores multiple different user agents', () =>
    expect(
      isHttpHook({
        headers: {
          'user-agent': ['Mozilla/5.0', 'Mozilla/6.0'],
        },
      }),
    ).toBe(false));

  it.each(['Mozilla/5.0', null, undefined, true])(
    'ignores a missing user agent',
    () => expect(isHttpHook(new Request('https://example.com'))).toBe(false),
  );
});
