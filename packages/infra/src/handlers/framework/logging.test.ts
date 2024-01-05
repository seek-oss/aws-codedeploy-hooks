describe('logger', () => {
  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) => {
      process.env.ENVIRONMENT = environment;

      return jest.isolateModulesAsync(async () => {
        await expect(import('./logging')).resolves.toMatchObject({
          logger: expect.any(Object),
        });
      });
    },
  );
});
