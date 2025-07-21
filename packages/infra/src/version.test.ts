import { version } from './version.js';

it('is a truthy string', () => {
  expect(typeof version).toBe('string');
  expect(version).toBeTruthy();
});
