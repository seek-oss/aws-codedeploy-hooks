import { GANTRY_HOOK_PREFIX, USER_AGENT_PREFIX } from './constants';

type HttpRequest = {
  headers: {
    get: (name: string) => string | null;
  };
};

/**
 * Whether the HTTP request originated from AWS CodeDeploy Hooks.
 *
 * This can be used to customise smoke test handling. When recovering a system
 * with unhealthy dependencies, it may be desirable to expedite recovery efforts
 * by skipping pre-deployment checks, while continuing to run the checks as per
 * usual on subsequent health check polling.
 *
 * ```typescript
 * const smokeTest = (req: Request) => {
 *   if (process.env.SKIP_HOOK && isHttpHook(req)) {
 *     // Expedite deployment even if dependencies are unhealthy.
 *     return;
 *   }
 *
 *   // Run dependency checks otherwise.
 *   return checkDependencies();
 * }
 * ```
 *
 * Checks for a `user-agent` header that starts with either:
 *
 * - `aws-codedeploy-hook-`
 * - `gantry-codedeploy-hook-BeforeAllowTraffic-`
 *
 * Compatible with Gantry v2.3.7 and newer.
 */
export const isHttpHook = (req: HttpRequest): boolean => {
  const userAgent = req.headers.get('user-agent');

  return Boolean(
    userAgent?.startsWith(GANTRY_HOOK_PREFIX) ||
      userAgent?.startsWith(USER_AGENT_PREFIX),
  );
};
