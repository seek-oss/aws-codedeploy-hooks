import { USER_AGENT_PREFIX } from './constants';

type HttpRequest = {
  headers: {
    get: (name: string) => string | null;
  };
};

export const isHttpHook = (req: HttpRequest): boolean =>
  Boolean(req.headers.get('user-agent')?.startsWith(USER_AGENT_PREFIX));
