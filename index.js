var http = require('http')
  , url = require('url');

// googlebot, yahoo, and bingbot are in this list even though
// we support _escaped_fragment_ to ensure it works for people
// who might not use the _escaped_fragment_ protocol
var crawlerUserAgents = [
  'googlebot',
  'yahoo',
  'bingbot',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot'
];

var extensionsToIgnore = [
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

var prerender = module.exports = function(req, res, next) {

  if(!prerender.shouldShowPrerenderedPage(req)) return next();

  prerender.getPrerenderedPageResponse(req, function(prerenderedResponse){

    if(prerenderedResponse) return res.send(prerenderedResponse.statusCode, prerenderedResponse.body);

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

  //if it contains _escaped_fragment_, show prerendered page
  if(url.parse(req.url, true).query.hasOwnProperty('_escaped_fragment_')) return true;

  //if it is not a bot...dont prerender
  if(crawlerUserAgents.every(function(crawlerUserAgent){ return userAgent.toLowerCase().indexOf(crawlerUserAgent.toLowerCase()) === -1;})) return false;

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
  return this.prerenderServiceUrl || process.env.PRERENDER_SERVICE_URL || 'http://prerender.herokuapp.com/';
};

prerender.set = function(name, value) {
  this[name] = value;
  return this;
}
