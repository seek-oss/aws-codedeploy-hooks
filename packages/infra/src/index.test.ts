import * as rootModule from '.';

describe('rootModule', () => {
  it('exports infrastructure', () =>
    expect(rootModule).toMatchInlineSnapshot(`
      {
        "HookStack": [Function],
        "LambdaDeployment": [Function],
      }
    `));
});
