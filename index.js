var http = require('http');

var crawlerUserAgents = [
  'googlebot',
  'yahoo',
  'bingbot',
  'baiduspider'
];

var extensionsToIgnore = [
  '.js',
  '.css',
  '.less',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.doc'
];

var prerender = module.exports = function(req, res, next) {

  if(!prerender.shouldShowPrerenderedPage(req)) return next();

  prerender.getPrerenderedPageResponse(req, function(prerenderedResponse){

    if(prerenderedResponse && prerenderedResponse.statusCode === 200) return res.send(prerenderedResponse.body);

    next();
  });
};

prerender.whitelisted = function(whitelist) {
  prerender.whitelist = typeof whitelist === 'string' ? [whitelist] : whitelist;
  return this;
};

prerender.blacklisted = function(blacklist) {
  prerender.blacklist = typeof blacklist === 'string' ? [blacklist] : blacklist;
  return this;
};

prerender.shouldShowPrerenderedPage = function(req) {  
  var userAgent = req.headers['user-agent'];
  if(!userAgent) return false;

  //if it is not a bot...dont prerender
  if(crawlerUserAgents.indexOf(userAgent.toLowerCase()) === -1) return false;

  //if it is a bot and is requesting a resource...dont prerender
  if(extensionsToIgnore.some(function(extension){return req.url.indexOf(extension) !== -1;})) return false;

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

  return true;
};

prerender.getPrerenderedPageResponse = function(req, callback) {
  http.get(prerender.buildApiUrl(req), function(res) {

    var pageData = "";
    res.on('data', function (chunk) {
      pageData += chunk;
    });

    res.on('end', function(){
      res.body = pageData;
      callback(res);
    });
  }).on('error', function(e) {
    callback(null);
  });
};

prerender.buildApiUrl = function(req) {
  var prerenderUrl = prerender.getPrerenderServiceUrl();
  var forwardSlash = prerenderUrl.indexOf('/', prerenderUrl.length - 1) !== -1 ? '' : '/';
  var fullUrl = req.protocol + "://" + req.get('host') + req.url;
  return prerenderUrl + forwardSlash + fullUrl
};

prerender.getPrerenderServiceUrl = function() {
  return process.env.PRERENDER_SERVICE_URL || 'http://prerender.herokuapp.com/';
};