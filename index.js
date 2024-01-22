var http = require('http')
  , https = require('https')
  , url = require('url')
  , zlib = require('zlib');

const adapters = { 'http:': http, 'https:': https};

var prerender = module.exports = function(req, res, next) {
  if(!prerender.shouldShowPrerenderedPage(req)) return next();

  prerender.beforeRenderFn(req, function(err, cachedRender) {

    if (!err && cachedRender) {
      if (typeof cachedRender == 'string') {
        res.writeHead(200, {
          "Content-Type": "text/html"
        });
        return res.end(cachedRender);
      } else if (typeof cachedRender == 'object') {
        res.writeHead(cachedRender.status || 200, {
          "Content-Type": "text/html"
        });
        return res.end(cachedRender.body || '');
      }
    }

    prerender.getPrerenderedPageResponse(req, function(err, prerenderedResponse){
      var options = prerender.afterRenderFn(err, req, prerenderedResponse);
      if (options && options.cancelRender) {
        return next();
      }

      if(prerenderedResponse){
        res.writeHead(prerenderedResponse.statusCode, prerenderedResponse.headers);
        return res.end(prerenderedResponse.body);
      } else {
        next(err);
      }
    });
  });
};

prerender.crawlerUserAgents = [
  'googlebot',
  'Google-InspectionTool',
  'Yahoo! Slurp',
  'bingbot',
  'yandex',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkShare',
  'W3C_Validator',
  'redditbot',
  'Applebot',
  'WhatsApp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'SkypeUriPreview',
  'nuzzel',
  'Discordbot',
  'Google Page Speed',
  'Qwantify',
  'pinterestbot',
  'Bitrix link preview',
  'XING-contenttabreceiver',
  'Chrome-Lighthouse',
  'TelegramBot',
  'SeznamBot',
  'screaming frog SEO spider',
  'AhrefsBot',
  'AhrefsSiteAudit',
  'Iframely'
];


prerender.extensionsToIgnore = [
  '.js',
  '.css',
  '.xml',
  '.less',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.doc',
  '.txt',
  '.ico',
  '.rss',
  '.zip',
  '.mp3',
  '.rar',
  '.exe',
  '.wmv',
  '.doc',
  '.avi',
  '.ppt',
  '.mpg',
  '.mpeg',
  '.tif',
  '.wav',
  '.mov',
  '.psd',
  '.ai',
  '.xls',
  '.mp4',
  '.m4a',
  '.swf',
  '.dat',
  '.dmg',
  '.iso',
  '.flv',
  '.m4v',
  '.torrent',
  '.woff',
  '.woff2',
  '.ttf',
  '.svg',
  '.webmanifest',
  '.webp'
];


prerender.whitelisted = function(whitelist) {
  prerender.whitelist = typeof whitelist === 'string' ? [whitelist] : whitelist;
  return this;
};


prerender.blacklisted = function(blacklist) {
  prerender.blacklist = typeof blacklist === 'string' ? [blacklist] : blacklist;
  return this;
};


prerender.shouldShowPrerenderedPage = function(req) {
  var userAgent = req.headers['user-agent']
    , bufferAgent = req.headers['x-bufferbot']
    , isRequestingPrerenderedPage = false;

  if(!userAgent) return false;
  if(req.method != 'GET' && req.method != 'HEAD') return false;
  if(req.headers && req.headers['x-prerender']) return false;

  var parsedUrl = url.parse(req.url, true);
  //if it contains _escaped_fragment_, show prerendered page
  var parsedQuery = parsedUrl.query;
  if(parsedQuery && parsedQuery['_escaped_fragment_'] !== undefined) isRequestingPrerenderedPage = true;

  //if it is a bot...show prerendered page
  if(prerender.crawlerUserAgents.some(function(crawlerUserAgent){ return userAgent.toLowerCase().indexOf(crawlerUserAgent.toLowerCase()) !== -1;})) isRequestingPrerenderedPage = true;

  //if it is BufferBot...show prerendered page
  if(bufferAgent) isRequestingPrerenderedPage = true;

  //if it is a bot and is requesting a resource...dont prerender
  var parsedPathname = parsedUrl.pathname.toLowerCase();
  if(prerender.extensionsToIgnore.some(function(extension){return parsedPathname.endsWith(extension)})) return false;

  //if it is a bot and not requesting a resource and is not whitelisted...dont prerender
  if(Array.isArray(this.whitelist) && this.whitelist.every(function(whitelisted){return (new RegExp(whitelisted)).test(req.url) === false;})) return false;

  //if it is a bot and not requesting a resource and is not blacklisted(url or referer)...dont prerender
  if(Array.isArray(this.blacklist) && this.blacklist.some(function(blacklisted){
    var blacklistedUrl = false
      , blacklistedReferer = false
      , regex = new RegExp(blacklisted);

    blacklistedUrl = regex.test(req.url) === true;
    if(req.headers['referer']) blacklistedReferer = regex.test(req.headers['referer']) === true;

    return blacklistedUrl || blacklistedReferer;
  })) return false;

  return isRequestingPrerenderedPage;
};


prerender.prerenderServerRequestOptions = {};

prerender.getPrerenderedPageResponse = function(req, callback) {
  var options = {
    headers: {}
  };
  for (var attrname in this.prerenderServerRequestOptions) { options[attrname] = this.prerenderServerRequestOptions[attrname]; }
  if (this.forwardHeaders === true) {
    Object.keys(req.headers).forEach(function(h) {
      // Forwarding the host header can cause issues with server platforms that require it to match the URL
      if (h == 'host') {
        return;
      }
      options.headers[h] = req.headers[h];
    });
  }
  options.headers['User-Agent'] = req.headers['user-agent'];
  options.headers['Accept-Encoding'] = 'gzip';
  if(this.prerenderToken || process.env.PRERENDER_TOKEN) {
    options.headers['X-Prerender-Token'] = this.prerenderToken || process.env.PRERENDER_TOKEN;
  }

  const url = new URL(prerender.buildApiUrl(req));
  // Dynamically use "http" or "https" module, since process.env.PRERENDER_SERVICE_URL can be set to http protocol
  adapters[url.protocol].get(url, options, (response) => {
    if(response.headers['content-encoding'] && response.headers['content-encoding'] === 'gzip') {
      prerender.gunzipResponse(response, callback);
    } else {
      prerender.plainResponse(response, callback);
    }
  }).on('error', function(err) {
    callback(err);
  });

};

prerender.gunzipResponse = function(response, callback) {
  var gunzip = zlib.createGunzip()
    , content = '';

  gunzip.on('data', function(chunk) {
    content += chunk;
  });
  gunzip.on('end', function() {
    response.body = content;
    delete response.headers['content-encoding'];
    delete response.headers['content-length'];
    callback(null, response);
  });
  gunzip.on('error', function(err){
    callback(err);
  });

  response.pipe(gunzip);
};

prerender.plainResponse = function(response, callback) {
  var content = '';

  response.on('data', function(chunk) {
    content += chunk;
  });
  response.on('end', function() {
    response.body = content;
    callback(null, response);
  });
};


prerender.buildApiUrl = function(req) {
  var prerenderUrl = prerender.getPrerenderServiceUrl();
  var forwardSlash = prerenderUrl.indexOf('/', prerenderUrl.length - 1) !== -1 ? '' : '/';

  var protocol = req.connection.encrypted ? "https" : "http";
  if (req.headers['cf-visitor']) {
    var match = req.headers['cf-visitor'].match(/"scheme":"(http|https)"/);
    if (match) protocol = match[1];
  }
  if (req.headers['x-forwarded-proto']) {
    protocol = req.headers['x-forwarded-proto'].split(',')[0];
  }
  if (this.protocol) {
    protocol = this.protocol;
  }

  // if set, ignore X-Forwarded-Host header to block SSRF attacks
  const xforwardedHost = this.ignoreXForwardedHost !== true && req.headers['x-forwarded-host'];
  const fullUrl = `${protocol}://${this.host || xforwardedHost || req.headers.host}${req.url}`;
  return prerenderUrl + forwardSlash + fullUrl;
};

prerender.getPrerenderServiceUrl = function() {
  return this.prerenderServiceUrl || process.env.PRERENDER_SERVICE_URL || 'https://service.prerender.io/';
};

prerender.beforeRenderFn = function(req, done) {
  if (!this.beforeRender) return done();

  return this.beforeRender(req, done);
};


prerender.afterRenderFn = function(err, req, prerender_res) {
  if (!this.afterRender) return;

  return this.afterRender(err, req, prerender_res);
};


prerender.set = function(name, value) {
  this[name] = value;
  return this;
};
