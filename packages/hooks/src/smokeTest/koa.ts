import { type HttpRequest, isHttpHook } from '../http';

type Context = { body: unknown; req: Readonly<HttpRequest>; status: number };

type Logger = {
  info: (message: string) => unknown;
  warn: (props: { err: unknown }, message: string) => unknown;
};

type Options = {
  /**
   * An instance of the application logger.
   *
   * When `skipHook` takes effect, the smoke test function is not entirely
   * skipped but is rather invoked in the background. Its execution does not
   * hold up or otherwise affect the HTTP response to the client, but its result
   * is still logged as a data point for future reference.
   */
  logger: Logger;

  /**
   * Whether to skip synchronous validation of the smoke test function during
   * pre-deployment checks from an AWS CodeDeploy hook.
   *
   * - Set to `false` in general operation to exercise the smoke test before
   *   accepting production traffic.
   * - Set to `true` when a build needs to be expedited in a disaster recovery
   *   scenario or when a dependency is known to be unhealthy.
   *
   * This option is ignored and synchronous validation of the `smokeTest`
   * function proceeds if the request does not originate from an AWS CodeDeploy
   * or Gantry hook user agent. For example, a regular health check poll from a
   * CloudWatch or Datadog synthetic will continue to exercise the smoke test.
   */
  skipHook: boolean;
};

/**
 * A Koa middleware that executes a smoke test function to check whether the
 * application is broadly operational and ready to serve requests.
 *
 * The `skipHook` option skips synchronous validation of the smoke test function
 * during pre-deployment checks from an AWS CodeDeploy hook. This may be used
 * when a build needs to be expedited in a disaster recovery scenario or when a
 * dependency is known to be unhealthy.
 */
export const koaMiddleware =
  (
    { logger, skipHook }: Options,

    /**
     * A function that checks whether the application is broadly operational and
     * ready to serve requests.
     *
     * A typical smoke test execution may validate that the application container
     * has started, its server process is accepting requests, its core application
     * logic is intact, and its dependencies are reachable.
     *
     * This function should `throw` an error upon failure; all other return values
     * will be treated as a success.
     */
    smokeTest: () => unknown,
  ) =>
  async (ctx: Context) => {
    if (isHttpHook(ctx.req) && skipHook) {
      // Run in the background. This avoids holding up the deployment while the
      // result is still logged as a data point for future reference.
      Promise.resolve()
        .then(() => smokeTest())
        .then(() => logger.info('Smoke test succeeded in background'))
        .catch((err: unknown) =>
          logger.warn({ err }, 'Smoke test failed in background'),
        );

      ctx.status = 200;
      ctx.body = 'Smoke test skipped';

      return;
    }

    await smokeTest();

    ctx.status = 200;
    ctx.body = 'Smoke test succeeded';

    return;
  };
