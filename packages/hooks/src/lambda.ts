import { USER_AGENT_PREFIX } from './constants';

type LambdaContext = {
  clientContext?: {
    Custom?: { 'user-agent'?: unknown; [key: PropertyKey]: unknown };
  };
};

export const isLambdaHook = (event: object, context: LambdaContext): boolean =>
  Boolean(
    Object.keys(event).length === 0 &&
      typeof context.clientContext?.Custom?.['user-agent'] === 'string' &&
      context.clientContext.Custom['user-agent'].startsWith(USER_AGENT_PREFIX),
  );
