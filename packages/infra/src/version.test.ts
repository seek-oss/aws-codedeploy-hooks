import { version } from './version';

it('is a truthy string', () => {
  expect(typeof version).toBe('string');
  expect(version).toBeTruthy();
});
