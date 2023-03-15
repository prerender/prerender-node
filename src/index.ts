import { PrerenderConfig } from "./config.interface";
import { crawlerUserAgents } from "./crawlerAgent";
import { extensionsToIgnore } from "./extensionsToIgnore";
import { shouldShowPrerenderedPage } from "./util";

class Prerender {
  private crawlerUserAgents: string[] = crawlerUserAgents;
  private extensionsToIgnore: string[] = extensionsToIgnore;
  private token: string = '';
  private serviceBaseUrl: string = process.env.PRERENDER_SERVICE_URL || 'https://service.prerender.io';
  private whiteList: string[] = [];
  private blackList: string[] = [];
  private forceHttps: boolean = false;

  init(config: PrerenderConfig) {
    if (config.crawlerUserAgents) this.setCrawlerUserAgents(config.crawlerUserAgents);
    if (config.extensionsToIgnore) this.setExtensionsToIgnore(config.extensionsToIgnore);
    if (config.token) this.setToken(config.token);
    if (config.serviceBaseUrl) this.setServiceUrl(config.serviceBaseUrl);
    if (config.whiteList) this.setWhiteList(config.whiteList);
    if (config.blackList) this.setBlackList(config.blackList);
    if (config.forceHttps) this.setForceHttps(config.forceHttps);
  }

  setForceHttps(forceHttps: boolean): void {
    this.forceHttps = forceHttps;
  }

  setWhiteList(whiteList: string[]): void {
    this.whiteList = whiteList;
  }

  addResourceToWhiteList(...whiteList: string[]): void {
    whiteList.forEach((whiteListItem) => {
      this.whiteList.push(whiteListItem);
    });
  }

  setBlackList(blackList: string[]): void {
    this.blackList = blackList;
  }

  addResourceToBlackList(...blackList: string[]): void {
    blackList.forEach((blackListItem) => {
      this.blackList.push(blackListItem);
    });
  }

  setServiceUrl(serviceUrl: string): void {
    this.serviceBaseUrl = serviceUrl;
  }

  setToken(token: string): void {
    this.token = token;
  }

  setCrawlerUserAgents(crawlerUserAgents: string[]): void {
    this.crawlerUserAgents = crawlerUserAgents;
  }

  addCrawlerUserAgents(...crawlerUserAgents: string[]): void {
    crawlerUserAgents.forEach((crawlerUserAgent) => {
      this.crawlerUserAgents.push(crawlerUserAgent);
    });
  }

  setExtensionsToIgnore(extensionsToIgnore: string[]): void {
    this.extensionsToIgnore = extensionsToIgnore;
  }

  addExtensionsToIgnore(...extensionsToIgnore: string[]): void {
    extensionsToIgnore.forEach((extensionToIgnore) => {
      this.extensionsToIgnore.push(extensionToIgnore);
    });
  }

  getPrerenderServiceUrl(): string {
    return this.serviceBaseUrl;
  }

  express(req, res, next) {}
  fastify() {}

  private buildApiUrl(req): string {
    let protocol = req.connection.encrypted ? 'https' : 'http';
    const forwardSlash = this.serviceBaseUrl.indexOf('/', this.serviceBaseUrl.length - 1) !== -1 ? '' : '/';

    if (req.headers['cf-visitor']) {
      const cfVisitor = JSON.parse(req.headers['cf-visitor']);
      protocol = cfVisitor.scheme;
    }

    if (req.headers['x-forwarded-proto']) {
      protocol = req.headers['x-forwarded-proto'];
    }

    if (this.forceHttps) {
      protocol = 'https';
    }

    const requestUrl = `${protocol}://${req.headers.host || req.headers['x-forwarded-host']}${req.url}`;

    return `${this.serviceBaseUrl}${forwardSlash}${requestUrl}`;
  }
}

const prerender = new Prerender();

export default prerender;