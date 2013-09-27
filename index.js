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

module.exports = function(req, res, next) {

  if(shouldShowPrerenderedPage(req)) {

    getPrerenderedPageResponse(req, function(prerenderedResponse){

      if(prerenderedResponse && prerenderedResponse.statusCode === 200) {
        console.log(prerenderedResponse);
        return res.send(prerenderedResponse.body);
      } else {
        next();
      }
    });

  } else {
    next();
  }
};

var shouldShowPrerenderedPage = function(req) {  
  var userAgent = req.headers['user-agent'];
  if(!userAgent) return false;

  if(crawlerUserAgents.indexOf(userAgent.toLowerCase()) === -1) return false; //if the user is not a crawler, dont prerender
  if(extensionsToIgnore.every(function(el){return req.url.indexOf(el) !== -1})) return false; //if the crawler is requesting a resource, dont prerender

  return true;
}

var getPrerenderedPageResponse = function(req, callback) {
    var prerenderUrl = process.env.PRERENDER_URL || 'http://prerender.herokuapp.com/';
    var forwardSlash = prerenderUrl.indexOf('/', prerenderUrl.length - 1) !== -1 ? '' : '/';
    var fullUrl = req.protocol + "://" + req.get('host') + req.url;

    http.get(prerenderUrl + forwardSlash + fullUrl, function(res) {

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
}