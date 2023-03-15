export interface PrerenderConfig {
  crawlerUserAgents?: string[];
  extensionsToIgnore?: string[];
  token?: string;
  serviceBaseUrl?: string;
  whiteList?: string[];
  blackList?: string[];
  forceHttps?: boolean;
}