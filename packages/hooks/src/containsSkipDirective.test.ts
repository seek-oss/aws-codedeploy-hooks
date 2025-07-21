import { containsSkipDirective } from './containsSkipDirective.js';

describe('containsSkipDirective', () => {
  it.each([
    null,
    undefined,
    '',
    '[skip]',
    '[skip] scopename',
    '[skip ci] scopename',
    'scopename [skip ci]',
    '[skip ci]',
    '[skip ciscopename]',
    '[skip ci,scopename]',
  ])('returns false for %s', (s) =>
    expect(containsSkipDirective(s, 'scopename')).toBe(false),
  );

  it.each([
    '[skip scopename]',
    '[skip scopename other]',
    '[skip other scopename]',
    '[skip other1 other2] [skip scopename]',
    '[skip scopename][skip other1 other2]',
  ])('returns true for %s', (s) =>
    expect(containsSkipDirective(s, 'scopename')).toBe(true),
  );
});
