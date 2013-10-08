var phantom = require('phantom');

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

  phantom.create({
      binary: require('phantomjs').path
  }, function(phantom) {
    phantom.createPage(function(page) {
      page.open(req.protocol + "://" + req.get('host') + req.url, function (status) {
        if ('fail' === status) {
          page.close();
          next();
        } else {
          setTimeout(function(){
              page.evaluate(function () {
                  return document && document.getElementsByTagName('html')[0].outerHTML
              }, function(documentHTML) {
                  var matches = documentHTML.match(/<script(?:.*?)>(?:[\S\s]*?)<\/script>/g);

                  for( var i = 0; matches && i < matches.length; i++) {
                      documentHTML = documentHTML.replace(matches[i], '');
                  }
                  res.send(documentHTML);
                  page.close();
              });
          }, 50);
        };
      });
    });
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