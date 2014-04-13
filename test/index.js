var assert = require('assert')
  , sinon = require('sinon')
  , prerender = require('../index')
  , bot = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
  , user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36';

describe('Prerender', function(){

  describe('#prerender', function(){

    var res, next;

    beforeEach(function () {
      res = { send: sinon.stub(), set: sinon.stub() };
      next = sinon.stub();
    });

    it('should return a prerendered response with the returned status code and headers', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot } };

      sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 301, body: '<html></html>', headers: { 'Location': 'http://google.com'}});

      prerender(req, res, next);

      prerender.getPrerenderedPageResponse.restore();

      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.deepEqual(res.set.getCall(0).args[0], { 'Location': 'http://google.com'});
      assert.equal(res.send.getCall(0).args[1], '<html></html>');
      assert.equal(res.send.getCall(0).args[0], 301);
    });

    it('should return a prerendered response if user is a bot by checking for _escaped_fragment_', function(){
      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user } };

      sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

      prerender(req, res, next);

      prerender.getPrerenderedPageResponse.restore();

      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[1], '<html></html>');
    });

    it('should call next() if the url is a bad url with _escaped_fragment_', function(){
      var req = { method: 'GET', url: '/path?query=params?_escaped_fragment_=', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if the request is not a GET', function(){
      var req = { method: 'POST', url: '/path', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if user is not a bot by checking agent string', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if user is a bot, but the bot is requesting a resource file', function(){
      var req = { method: 'GET', url: '/main.js?anyQueryParam=true', headers: { 'user-agent': bot } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if the url is not part of the regex specific whitelist', function(){
      var req = { method: 'GET', url: '/saved/search/blah?_escaped_fragment_=', headers: { 'user-agent': bot } };

      prerender.whitelisted(['^/search', '/help'])(req, res, next);

      delete prerender.whitelist;
      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the url is part of the regex specific whitelist', function(){
      var req = { method: 'GET', url: '/search/things?query=blah&_escaped_fragment_=', headers: { 'user-agent': bot } };

      sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

      prerender.whitelisted(['^/search.*query', '/help'])(req, res, next);

      prerender.getPrerenderedPageResponse.restore();

      delete prerender.whitelist;
      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[1], '<html></html>');
    });

    it('should call next() if the url is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/search/things?query=blah', headers: { 'user-agent': bot } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the url is not part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/profile/search/blah', headers: { 'user-agent': bot } };

      sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      prerender.getPrerenderedPageResponse.restore();

      delete prerender.blacklist;
      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[1], '<html></html>');
    });

    it('should call next() if the referer is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/search', 'user-agent': bot } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the referer is not part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/profile/search', 'user-agent': bot } };

      sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      prerender.getPrerenderedPageResponse.restore();

      delete prerender.blacklist;
      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[1], '<html></html>');
    });

    it('should return a prerendered response if a string is returned from beforeRender', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot } };

      prerender.set('beforeRender', function(req, done) {
        done(null, '<html>cached</html>');
      });

      prerender(req, res, next);

      assert.equal(next.callCount, 0);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[1], '<html>cached</html>');
    });
  });

  describe('#whitelisted', function(){
    it('should return the prerendered middleware function', function(){
      assert.equal(prerender.whitelisted(), prerender);
    });
  });

  describe('#blacklisted', function(){
    it('should return the prerendered middleware function', function(){
      assert.equal(prerender.blacklisted(), prerender);
    });
  });

  describe('#buildApiUrl', function(){
    it('should build the correct api url with the default url', function(){
      var req = {
        protocol: 'https',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'http://service.prerender.io/https://google.com/search?q=javascript');
    });

    it('should build the correct api url with an environment variable url', function(){
      var req = {
        protocol: 'https',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
        }
      };

      process.env.PRERENDER_SERVICE_URL = 'http://prerenderurl.com';
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/https://google.com/search?q=javascript');
      delete process.env.PRERENDER_SERVICE_URL;
    });

    it('should build the correct api url with an initialization variable url', function(){
      var req = {
        protocol: 'https',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
        }
      };

      prerender.set('prerenderServiceUrl', 'http://prerenderurl.com');
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/https://google.com/search?q=javascript');
      delete prerender.prerenderServiceUrl;
    });

    // Check CF-Visitor header in order to Work behind CloudFlare with Flexible SSL (https://support.cloudflare.com/hc/en-us/articles/200170536)
    it('should build the correct api url for the Cloudflare Flexible SSL support', function(){
      var req = {
        protocol: 'http',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
          if(v === 'CF-Visitor') return '"scheme":"https"';
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'http://service.prerender.io/https://google.com/search?q=javascript');
    });

    // Check X-Forwarded-Proto because Heroku SSL Support terminates at the load balancer
    it('should build the correct api url for the Heroku SSL Addon support', function() {
      var req = {
        protocol: 'http',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
          if(v === 'X-Forwarded-Proto') return 'https';
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'http://service.prerender.io/https://google.com/search?q=javascript');
    });
  });
});
