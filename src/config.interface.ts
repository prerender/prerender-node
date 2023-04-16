export interface PrerenderAgentOptions {
  /**
   * List of crawler user agents. If the user agent is in this list,
   * the request will be forwarded to the prerender server.
   *
   * @example
   * crawlerUserAgents: [
   *  'googlebot',
   *  'bingbot',
   *  'yandex',
   *  'baiduspider',
   * ]
   */
  crawlerUserAgents?: string[];

  /**
   * List of extensions to ignore. If the request url contains one of these extensions,
   * the request will not be forwarded to the prerender server.
   *
   * @example
   * extensionsToIgnore: [
   *  '.js',
   *  '.css',
   *  '.xml',
   *  '.jpg',
   *  '.pdf',
   * ];
   */
  extensionsToIgnore?: string[];

  /**
   * Prerender.io token. If you don't have a token, you can get one
   * for free at https://prerender.io/
   *
   * When token is set, the request will be forwarded to the Prerender.io server.
   * Otherwise should use self-hosted prerender server.
   */
  token?: string;

  /**
   * Prerender service url. By default it is set to https://service.prerender.io
   * If you want to use self-hosted prerender server, you can set this option.
   *
   * @example
   * serviceUrl: 'http://localhost:3000'
   */
  serviceUrl?: string;

  /**
   * List of resources to whitelist. If the request url contains one of these resources,
   * the request will be forwarded to the prerender server.
   *
   * If you want to prerender all resources except a few,
   * you can use the {@link blackList} option.
   *
   * @example
   * whiteList: [
   *  '/about',
   *  '/assets/images/logo.png',
   *  'robots.txt',
   * ];
   */
  whiteList?: string[];

  /**
   * List of resources to blacklist. If the request url contains one of these resources,
   * the request will not be forwarded to the prerender server.
   *
   * If you want to prerender a few by default forbidden resources,
   * you can use the {@link whiteList} option.
   */
  blackList?: string[];

  /**
   * TODO: do we want to use this instead of protocol?
   * Force https. If this option is set to true, the request will be forwarded to the
   * prerender server with https protocol.
   *
   * @example
   * forceHttps: true
   */
  // forceHttps?: boolean;

  /**
   * Request protocol. Option to hard-set the protocol.
   * Useful for sites that are available on both http and https.
   */
  protocol?: 'http' | 'https';

  /**
   * Useful for sites that are behind a load balancer or internal reverse proxy.
   * For example, your internal URL looks like `http://internal-host.com/` and you
   * might want it to instead send a request to Prerender.io with your real domain
   * in place of `internal-host.com`.
   */
  host?: string;

  /**
   * Option to forward headers from request to prerender.
   *
   * @example
   * forwardHeaders: true
   */
  forwardHeaders?: boolean;

  /**
   * Prerender server request options. If you want to set some additional options
   * for the request to the prerender server, you can use this option.
   *
   * @example
   * prerenderServerRequestOptions: {
   *   timeout: 1000,
   * }
   */
  prerenderServerRequestOptions?: {
    [key: string]: any;
  };
}
