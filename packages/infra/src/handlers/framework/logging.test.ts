describe('logger', () => {
  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) =>
      // @ts-expect-error - missing from `@types/jest`
      jest.isolateModulesAsync(async () => {
        process.env.ENVIRONMENT = environment;

        await expect(import('./logging')).resolves.toMatchObject({
          logger: expect.any(Object),
        });
      }),
  );
});
