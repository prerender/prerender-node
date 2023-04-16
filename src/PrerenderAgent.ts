import { PrerenderAgentOptions } from './config.interface';
import url from 'url';
import zlib from 'zlib';
import { crawlerUserAgents } from './crawlerAgent';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { extensionsToIgnore } from './extensionsToIgnore';

export type CachedRender = string | { status?: number; body?: string };
export type PrerenderedPageResponse = {
  statusCode: number;
  body: string;
  headers: any;
};

/**
 * // TODO: Add a description of the class
 */
export default class PrerenderAgent {
  private extensionsToIgnore: string[] = extensionsToIgnore;
  private crawlerUserAgents: string[] = crawlerUserAgents;
  private protocol: 'http' | 'https';
  private host: string | undefined;
  private serviceUrl: string = 'https://service.prerender.io';
  private whiteList: string[] = [];
  private blackList: string[] = [];
  private token: string = '';
  private prerenderServerRequestOptions = {};
  private forwardHeaders: boolean = false;

  /**
   * Initialize the PrerenderAgent
   *
   * @param options - Configuration object
   */
  init(options: PrerenderAgentOptions) {
    if (options.crawlerUserAgents)
      this.addCrawlerUserAgents(options.crawlerUserAgents);

    if (options.extensionsToIgnore)
      this.addExtensionsToIgnore(options.extensionsToIgnore);

    if (options.token) this.setToken(options.token);

    if (options.serviceUrl) this.setServiceUrl(options.serviceUrl);

    if (options.whiteList) this.addResourceToWhiteList(options.whiteList);

    if (options.blackList) this.addResourceToBlackList(options.blackList);

    if (options.protocol) this.setProtocol(options.protocol);

    if (options.host) this.setHost(options.host);

    if (options.forwardHeaders) this.setForwardHeaders(options.forwardHeaders);

    if (options.prerenderServerRequestOptions)
      this.setPrerenderServerRequestOptions(
        options.prerenderServerRequestOptions
      );
  }

  /**
   * Override the default white list
   *
   * @param whiteList - Array of resources to use as the white list
   */
  setWhiteList(whiteList: string[]): void {
    this.whiteList = whiteList;
  }

  /**
   * Add resources to the default white list
   *
   * @param whiteList - Array of resources to add to the white list
   */
  addResourceToWhiteList(whiteList: string[]): void {
    whiteList.forEach((whiteListItem) => {
      this.whiteList.push(whiteListItem);
    });
  }

  /**
   * Override the default black list
   *
   * @param blackList - Array of resources to use as the black list
   */
  setBlackList(blackList: string[]): void {
    this.blackList = blackList;
  }

  /**
   * Add resources to the default black list
   *
   * @param blackList - Array of resources to add to the black list
   */
  addResourceToBlackList(blackList: string[]): void {
    blackList.forEach((blackListItem) => {
      this.blackList.push(blackListItem);
    });
  }

  /**
   * Override the default bot/crawler user agents
   *
   * @param crawlerUserAgents - Array of user agents to use as the crawler user agents
   */
  setCrawlerUserAgents(crawlerUserAgents: string[]): void {
    this.crawlerUserAgents = crawlerUserAgents;
  }

  /**
   * Add user agents to the default crawler user agents
   *
   * @param crawlerUserAgents - Array of user agents to add to the crawler user agents
   */
  addCrawlerUserAgents(crawlerUserAgents: string[]): void {
    crawlerUserAgents.forEach((crawlerUserAgent) => {
      this.crawlerUserAgents.push(crawlerUserAgent);
    });
  }

  /**
   * Override the default extensions to ignore
   *
   * @param extensionsToIgnore - Array of extensions to use as the extensions to ignore
   */
  setExtensionsToIgnore(extensionsToIgnore: string[]): void {
    this.extensionsToIgnore = extensionsToIgnore;
  }

  /**
   * Add extensions to the default extensions to ignore
   *
   * @param extensionsToIgnore - Array of extensions to add to the extensions to ignore
   */
  addExtensionsToIgnore(extensionsToIgnore: string[]): void {
    extensionsToIgnore.forEach((extensionToIgnore) => {
      this.extensionsToIgnore.push(extensionToIgnore);
    });
  }

  /**
   * Set prerender service url
   * @param serviceUrl - Prerender service url
   */
  setServiceUrl(serviceUrl: string): void {
    this.serviceUrl = this.removeAllTrailingSlash(serviceUrl);
  }

  getServiceUrl(): string {
    return this.serviceUrl;
  }

  setHost(host: string): void {
    this.host = host;
  }

  getHost(): string | undefined {
    return this.host;
  }

  /**
   * Set the prerender.io API token. Use it only if you have a Prererender.io account.
   * @param token - Prerender.io API token
   */
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string {
    return this.token;
  }

  setPrerenderServerRequestOptions(options: any) {
    this.prerenderServerRequestOptions = options;
  }

  getPrerenderServerRequestOptions() {
    return this.prerenderServerRequestOptions;
  }

  /**
   * Set whether to forward headers to the Prerender server
   * @param forwardHeaders - Whether to forward headers to the Prerender server
   */
  setForwardHeaders(forwardHeaders: boolean) {
    this.forwardHeaders = forwardHeaders;
  }

  getForwardHeaders() {
    return this.forwardHeaders;
  }

  async getPrerenderedPageResponse(
    requestUrl: string,
    headers: any
  ): Promise<PrerenderedPageResponse> {
    const options = {
      headers: {
        // TODO: shorten this agent name, we send billions of requests, every byte counts
        'X-Prerender-Agent': `Node.js Prerender Agent v${
          require('../package.json').version
        }`,
      },
    };

    // Apply any custom options
    for (const option in this.prerenderServerRequestOptions) {
      options[option] = this.prerenderServerRequestOptions[option];
    }

    // Forward headers to Prerender server
    if (this.forwardHeaders) {
      for (const header in headers) {
        if (header === 'host') {
          continue;
        }
        options.headers[header] = headers[header];
      }
    }

    options.headers['User-Agent'] = headers['user-agent'];
    options.headers['Accept-Encoding'] = 'gzip';

    if (this.token || process.env.PRERENDER_TOKEN) {
      options.headers['X-Prerender-Token'] =
        this.token || process.env.PRERENDER_TOKEN;
    }

    const url = new URL(this.buildApiUrl(requestUrl, headers));

    return new Promise<PrerenderedPageResponse>((resolve, reject) => {
      const responseHandler = (res: IncomingMessage) => {
        if (
          res.headers['content-encoding'] &&
          res.headers['content-encoding'] === 'gzip'
        ) {
          this.gunzipResponse(res, resolve, reject);
        } else {
          this.plainResponse(res, resolve, reject);
        }
      };

      if (url.protocol === 'https:') {
        https.get(url, options, responseHandler).on('error', (e) => {
          reject(e);
        });
      } else {
        http.get(url, options, responseHandler).on('error', (e) => {
          reject(e);
        });
      }
    });
  }

  shouldShowPrerenderedPage(
    urlString: string,
    method: string,
    headers: any
  ): boolean {
    const { userAgent, bufferAgent, referer, xPrerender } = headers;

    if (!userAgent) return false;
    if (method !== 'GET' && method !== 'HEAD') return false;
    if (xPrerender) return false;

    const isBot =
      this.crawlerUserAgents.some((crawlerUserAgent) => {
        return userAgent.indexOf(crawlerUserAgent) > -1;
      }) || bufferAgent;

    const parsedUrl = url.parse(urlString, true);

    // Not a known bot, but still
    if (!isBot) {
      if (!parsedUrl.query) return false;
      if (!parsedUrl.query._escaped_fragment_) return false;
    }

    return true;
  }

  /**
   * Unzip the gzipped response and resolve/reject the promise
   *
   * @param response - IncomingMessage
   */
  private gunzipResponse(
    response: IncomingMessage,
    resolve: (
      value: PrerenderedPageResponse | PromiseLike<PrerenderedPageResponse>
    ) => void,
    reject: (reason?: any) => void
  ): void {
    const gunzip = zlib.createGunzip();
    const contentChunks: Buffer[] = [];

    gunzip.on('error', (err) => {
      reject(err);
    });

    gunzip.on('data', (chunk: Buffer) => {
      contentChunks.push(chunk);
    });

    gunzip.on('end', () => {
      // We don't need these headers anymore, because we already decompressed the response
      delete response.headers['content-encoding'];
      delete response.headers['content-length'];
      resolve({
        /**
         * Docs says about statusCode:
         * **Only valid for response obtained from {@link ClientRequest}.**
         * We used http.get() and https.get() to get response, so it's valid.
         * @see https://nodejs.org/api/http.html#http_message_statuscode
         */
        statusCode: response.statusCode as number,
        headers: response.headers,
        body: Buffer.concat(contentChunks).toString(),
      });
    });

    response.pipe(gunzip);
  }

  /**
   * Resolve/reject the promise with the response
   *
   * @param response {IncomingMessage} Incoming message
   */
  private plainResponse(
    response: IncomingMessage,
    resolve: (
      value: PrerenderedPageResponse | PromiseLike<PrerenderedPageResponse>
    ) => void,
    reject: (reason?: any) => void
  ): void {
    const contentChunks: Buffer[] = [];

    response.on('error', (err) => {
      reject(err);
    });

    response.on('data', (chunk: Buffer) => {
      contentChunks.push(chunk);
    });

    response.on('end', () => {
      resolve({
        /**
         * Docs says about statusCode:
         * **Only valid for response obtained from {@link ClientRequest}.**
         * We used http.get() and https.get() to get response, so it's valid.
         * @see https://nodejs.org/api/http.html#http_message_statuscode
         */
        statusCode: response.statusCode as number,
        headers: response.headers,
        body: Buffer.concat(contentChunks).toString(),
      });
    });
  }

  /**
   * Build the API URL to send to the Prerender server.
   *
   * @param requestUrl The URL of the request.
   * @param headers The headers of the request.
   * @returns The API URL to send to the Prerender server.
   */
  private buildApiUrl(requestUrl: string, headers: any): string {
    const { fallbackProtocol } = headers;

    const protocol = this.getProtocol(headers) || fallbackProtocol;

    const host = this.host || headers['x-forwarded-host'] || headers.host;
    const fullUrl = `${protocol}://${host}${requestUrl}`;

    return `${this.serviceUrl}/${fullUrl}`;
  }

  public setProtocol(protocol: 'http' | 'https'): void {
    this.protocol = protocol;
  }

  /**
   * Get the protocol of the request.
   *
   * The protocol is determined by the following rules:
   * 1. If the user has set the protocol, use that.
   * 2. If the XFP header is set, use that.
   * 3. If the CF-Visitor header is set, use that.
   * 4. If the web server protocol is set, use that.
   * 5. Fall back to http.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
   * @see https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/#cf-visitor
   * @param headers The headers of the request.
   * @param webServerProtocol The protocol set by the web server.
   */
  private getProtocol(
    headers: any,
    webServerProtocol?: 'http' | 'https'
  ): 'http' | 'https' | null {
    // Highest priority: protocol set by user
    if (this.protocol) {
      return this.protocol;
    }

    // Second priority: XFP header
    if (headers['x-forwarded-proto']) {
      return headers['x-forwarded-proto'].split(',')[0] as 'http' | 'https';
    }

    // Third priority: protocol set by Cloudflare
    if (headers['cf-visitor']) {
      const match = headers['cf-visitor'].match(/"scheme":"(http|https)"/);
      if (match) {
        return match[1] as 'http' | 'https';
      }
    }

    // Fourth priority: protocol set by web server
    if (webServerProtocol) {
      return webServerProtocol;
    }

    // Fall back to http
    return 'http';
  }

  /**
   * Remove all trailing slashes from a URL
   * @see https://stackoverflow.com/questions/6680825/return-string-without-trailing-slash#comment124354948_6680877
   * @param url The URL to remove the trailing slashes from.
   */
  private removeAllTrailingSlash(url: string): string {
    let i = url.length;

    // Decrease the index until we find a non-slash character
    while (url[--i] === '/');

    return url.slice(0, i + 1);
  }
}
