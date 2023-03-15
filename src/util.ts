import url from "url";
import { crawlerUserAgents } from "./crawlerAgent";

const isResourceWhitelisted = (url: string, whitelist: string[] = []): boolean => {
  return whitelist.every((whitelistedUrl: string) => {
    return new RegExp(whitelistedUrl).test(url);
  });
}

const isResourceBlacklisted = (url: string, blacklist: string[] = [], referer: string): boolean => {
  return blacklist.some((blacklistedItem: string) => {
    const regex = new RegExp(blacklistedItem);
    
    const blacklistedUrl = regex.test(url);
    const blacklistedReferer = regex.test(referer);

    return blacklistedUrl || blacklistedReferer;
  });
}

export const shouldShowPrerenderedPage = (request: {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH',
  headers: {
    [key: string]: string,
  },
  url: string,
}, options: {
  extensionsToIgnore?: string[],
  whitelist?: string[],
  blacklist?: string[],
}): boolean => {
  const { method, headers } = request;
  const { extensionsToIgnore, whitelist, blacklist } = options;
  const userAgent = headers['user-agent'];
  const bufferAgent = headers['x-bufferbot'] ?? '';

  if (!userAgent) return false;
  if (method !== 'GET' && method !== 'HEAD') return false;

  // We don't want to serve prerender requests, it will cause an infinite loop
  if (headers && headers['x-prerender']) return false;

  let isRequestingPrerenderedPage = false;

  const parsedUrl = url.parse(request.url, true)
  const parsedQuery = parsedUrl.query;

  // If the query contains _escaped_fragment_, show the prerendered page
  if (parsedQuery && parsedQuery._escaped_fragment_) {
    isRequestingPrerenderedPage = true;
  }

  // If the user agent is a bot, show the prerendered page
  if (crawlerUserAgents.some((crawlerUserAgent) => userAgent.toLowerCase().includes(crawlerUserAgent.toLowerCase()))) {
    isRequestingPrerenderedPage = true;
  }

  // If the user agent is Buffer, show the prerendered page
  if (bufferAgent) {
    isRequestingPrerenderedPage = true;
  }

  // If the request is for a resource file, don't show the prerendered page
  const parsedPathName = parsedUrl.pathname?.toLowerCase();
  if (extensionsToIgnore && extensionsToIgnore.some((extensionToIgnore: string) => parsedPathName?.endsWith(extensionToIgnore))) {
    return false;
  }

  // If the request is for a whitelisted resource, show the prerendered page
  if (whitelist && whitelist.length > 0) {
    isRequestingPrerenderedPage = isResourceWhitelisted(request.url, whitelist);
  }

  // If the request is for a blacklisted resource, don't show the prerendered page
  if (blacklist && blacklist.length > 0) {
    isRequestingPrerenderedPage = !isResourceBlacklisted(request.url, blacklist, headers.referer);
  }

  return isRequestingPrerenderedPage;
}