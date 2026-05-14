import { describe, expect, it } from 'vitest';

import * as rootModule from './index.js';

describe('rootModule', () => {
  it('exports infrastructure', () =>
    expect(rootModule).toMatchInlineSnapshot(`
      {
        "HookStack": [Function],
        "LambdaDeployment": [Function],
      }
    `));
});
