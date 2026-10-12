import 'server-only';
import { EnvHttpProxyAgent, fetch as proxyFetch } from 'undici';
// Respect the host's configured outbound proxy. Deployed hosts normally use native fetch.
let dispatcher: EnvHttpProxyAgent | undefined;
export async function fetchPublicSource(url: string, options: RequestInit = {}): Promise<Response> {
  if (
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy
  ) {
    dispatcher ??= new EnvHttpProxyAgent();
    return (await proxyFetch(url, { ...options, dispatcher } as Parameters<
      typeof proxyFetch
    >[1])) as unknown as Response;
  }
  return fetch(url, options);
}
