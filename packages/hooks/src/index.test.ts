import * as rootModule from './index.js';

describe('rootModule', () => {
  it('exports runtime helpers', () =>
    expect(rootModule).toMatchInlineSnapshot(`
      {
        "containsSkipDirective": [Function],
        "isHttpHook": [Function],
        "isLambdaHook": [Function],
        "smokeTest": {
          "koaMiddleware": [Function],
        },
      }
    `));
});
