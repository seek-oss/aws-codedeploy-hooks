import { USER_AGENT_PREFIX } from './constants';

type LambdaContext = {
  clientContext?: {
    custom?: { 'user-agent'?: unknown; [key: PropertyKey]: unknown };
  };
};

/**
 * Whether the Lambda invocation originated from AWS CodeDeploy Hooks.
 *
 * This can be used to customise smoke test handling. When recovering a system
 * with unhealthy dependencies, it may be desirable to expedite recovery efforts
 * by skipping pre-deployment checks, while continuing to run the checks as per
 * usual on subsequent health check polling.
 *
 * ```typescript
 * const handler = (event: Event, ctx: Context) => {
 *   if (!Object.entries(event).length) {
 *     if (process.env.SKIP_HOOK && isLambdaHook(event, ctx)) {
 *       // Expedite deployment even if dependencies are unhealthy.
 *       return;
 *     }
 *
 *     // Run dependency checks otherwise.
 *     return checkDependencies();
 *   }
 *
 *   // Run application logic.
 *   // ...
 * }
 * ```
 *
 * Checks for:
 *
 * - An empty event object
 * - A custom `user-agent` in context that starts with `aws-codedeploy-hook-`
 */
export const isLambdaHook = (
  event: object,
  { clientContext }: LambdaContext,
): boolean =>
  Boolean(
    Object.keys(event).length === 0 &&
      typeof clientContext?.custom?.['user-agent'] === 'string' &&
      clientContext.custom['user-agent'].startsWith(USER_AGENT_PREFIX),
  );
