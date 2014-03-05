var request = require('request')
  , url = require('url');

var prerender = module.exports = function(req, res, next) {

  if(!prerender.shouldShowPrerenderedPage(req)) return next();

  prerender.beforeRenderFn(req, function(err, cachedRender) {

    if (!err && cachedRender && typeof cachedRender == 'string') {
      return res.send(200, cachedRender);
    }

    prerender.getPrerenderedPageResponse(req, res, function(prerenderedResponse){

      if(prerenderedResponse) {
        prerender.afterRenderFn(req, prerenderedResponse);
        return res.send(prerenderedResponse.statusCode);
      }

      next();
    });
  });
};

// googlebot, yahoo, and bingbot are not in this list because
// we support _escaped_fragment_ and want to ensure people aren't
// penalized for cloaking.
prerender.crawlerUserAgents = [
  // 'googlebot',
  // 'yahoo',
  // 'bingbot',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'bufferbot',
  'quora link preview'
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
  '.torrent'
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
    , isRequestingPrerenderedPage = false;

  if(!userAgent) return false;
  if(req.method != 'GET') return false;

  //if it contains _escaped_fragment_, show prerendered page
  if(url.parse(req.url, true).query.hasOwnProperty('_escaped_fragment_')) isRequestingPrerenderedPage = true;

  //if it is a bot...show prerendered page
  if(prerender.crawlerUserAgents.some(function(crawlerUserAgent){ return userAgent.toLowerCase().indexOf(crawlerUserAgent.toLowerCase()) !== -1;})) isRequestingPrerenderedPage = true;

  //if it is a bot and is requesting a resource...dont prerender
  if(prerender.extensionsToIgnore.some(function(extension){return req.url.indexOf(extension) !== -1;})) return false;

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


prerender.getPrerenderedPageResponse = function(req, res, callback) {
  var options = {
    uri: url.parse(prerender.buildApiUrl(req))
  };
  if(this.prerenderToken || process.env.PRERENDER_TOKEN) {
    options.headers = {
      'X-Prerender-Token': this.prerenderToken || process.env.PRERENDER_TOKEN,
      'User-Agent': req.headers['user-agent']
    };
  } else {
    options.headers = {};
  }
  var acceptEncoding = req.headers['accept-encoding'];
  if (acceptEncoding) {
    options.headers['accept-encoding'] = acceptEncoding;
  }

  var renderRequest = request(options);

  renderRequest.on('response', function (renderResponse) {
    if (renderResponse.statusCode !== 200) {
      callback(null);
    } else {

      res.set(renderResponse.headers);

      renderResponse.on('data', function(chunk) {
        res.write(chunk);
      });

      renderResponse.on('end', function(chunk) {
        callback(renderResponse);
      });
    }
  });

  renderRequest.on('error', function () {
    callback(null);
  });
};


prerender.buildApiUrl = function(req) {
  var prerenderUrl = prerender.getPrerenderServiceUrl();
  var forwardSlash = prerenderUrl.indexOf('/', prerenderUrl.length - 1) !== -1 ? '' : '/';

  var protocol = req.protocol;
  if (req.get('CF-Visitor')) {
    var match = req.get('CF-Visitor').match(/"scheme":"(http|https)"/);
    if (match) protocol = match[1];
  }
  if (req.get('X-Forwarded-Proto')) {
    protocol = req.get('X-Forwarded-Proto');
  }
  var fullUrl = protocol + "://" + req.get('host') + req.url;
  return prerenderUrl + forwardSlash + fullUrl
};


prerender.getPrerenderServiceUrl = function() {
  return this.prerenderServiceUrl || process.env.PRERENDER_SERVICE_URL || 'http://service.prerender.io/';
};

prerender.beforeRenderFn = function(req, done) {
  if (!this.beforeRender) return done();

  return this.beforeRender(req, done);
};


prerender.afterRenderFn = function(req, prerender_res) {
  if (!this.afterRender) return;

  this.afterRender(req, prerender_res);
};


prerender.set = function(name, value) {
  this[name] = value;
  return this;
};
