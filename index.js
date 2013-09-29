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

  if(crawlerUserAgents.indexOf(userAgent.toLowerCase()) === -1) return false; //if is not a bot
  if(extensionsToIgnore.some(function(extension){return req.url.indexOf(extension) !== -1;})) return false; //if is requesting a resource
  if(Array.isArray(this.whitelist) && this.whitelist.some(function(whitelisted){return req.url.indexOf(whitelisted) === -1;})) return false; //if is not whitelisted
  if(Array.isArray(this.blacklist) && this.blacklist.every(function(blacklisted){return req.url.indexOf(blacklisted) !== -1;})) return false; //if is not blacklisted

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