import * as rootModule from '.';

describe('rootModule', () => {
  it('exports runtime helpers', () =>
    expect(rootModule).toMatchInlineSnapshot(`
      {
        "isHttpHook": [Function],
        "isLambdaHook": [Function],
      }
    `));
});
