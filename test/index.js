var assert = require('assert')
  , sinon = require('sinon')
  , prerender = require('../index')
  , request    = require('request')
  , zlib = require('zlib')
  , bot = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
  , user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36';

function mockRequest(statusCode, body, headers) {
  return {
    on: function (name, f) {
      if (name === 'response') {
        f({
            statusCode: statusCode,
            headers: headers || {},
            on: function (name, f) {
              if (name === 'data') {
                f(body);
              } else if (name === 'end') {
                f();
              }
            },
            pipe: function (stream) {
                stream.write(body);
                stream.end();
            }
          });
      }
      return this;
    }
  };
}

describe('Prerender', function(){

  describe('#prerender', function(){

    var sandbox, res, next;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();

      prerender.prerenderToken = 'MY_TOKEN';
      res = { send: sandbox.stub(), set: sandbox.stub(), status: sandbox.stub() };
      next = sandbox.stub();
      sandbox.stub(prerender, 'buildApiUrl').returns('http://google.com');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return a prerendered response with the returned status code and headers', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot } };

      sandbox.stub(request, 'get').returns(mockRequest(301, '<html></html>', { 'Location': 'http://google.com'}));

      prerender(req, res, next);

      assert.equal(request.get.getCall(0).args[0].uri.href, 'http://google.com/');
      assert.equal(request.get.getCall(0).args[0].headers['X-Prerender-Token'], 'MY_TOKEN');
      assert.equal(request.get.getCall(0).args[0].headers['Accept-Encoding'], 'gzip');
      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.send.callCount, 1);
      assert.deepEqual(res.set.getCall(0).args[0], { 'Location': 'http://google.com'});
      assert.equal(res.send.getCall(0).args[0], '<html></html>');
      assert.equal(res.status.getCall(0).args[0], 301);
    });


    it('should return a prerendered response if user is a bot by checking for _escaped_fragment_', function(){
      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user } };

      sandbox.stub(request, 'get').returns(mockRequest(200, '<html></html>'));

      prerender(req, res, next);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 200);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html></html>');
    });

    it('should return a prerendered gzipped response', function(done){

      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user } };
      // we're dealing with asynchonous gzip so we can only assert on res.send. If it's not called, the default mocha timeout of 2s will fail the test
      res.send = function (content) {
        assert.equal(res.status.callCount, 1);
        assert.equal(res.status.getCall(0).args[0], 200);
        assert.equal(next.callCount, 0);
        assert.equal(content, '<html></html>');
        done();
      };

      zlib.gzip(new Buffer('<html></html>', 'utf-8'), function (err, zipped) {
        sandbox.stub(request, 'get').returns(mockRequest(200, zipped, {'content-encoding': 'gzip'}));

        prerender(req, res, next);
      });

    });

    it('should call next() if the url is a bad url with _escaped_fragment_', function(){
      var req = { method: 'GET', url: '/path?query=params?_escaped_fragment_=', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if the request is not a GET', function(){
      var req = { method: 'POST', url: '/path', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if user is not a bot by checking agent string', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if user is a bot, but the bot is requesting a resource file', function(){
      var req = { method: 'GET', url: '/main.js?anyQueryParam=true', headers: { 'user-agent': bot } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should call next() if the url is not part of the regex specific whitelist', function(){
      var req = { method: 'GET', url: '/saved/search/blah?_escaped_fragment_=', headers: { 'user-agent': bot } };

      prerender.whitelisted(['^/search', '/help'])(req, res, next);

      delete prerender.whitelist;
      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the url is part of the regex specific whitelist', function(){
      var req = { method: 'GET', url: '/search/things?query=blah&_escaped_fragment_=', headers: { 'user-agent': bot } };

      sandbox.stub(request, 'get').returns(mockRequest(200, '<html></html>'));

      prerender.whitelisted(['^/search.*query', '/help'])(req, res, next);

      delete prerender.whitelist;
      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 200);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html></html>');
    });

    it('should call next() if the url is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/search/things?query=blah', headers: { 'user-agent': bot } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the url is not part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/profile/search/blah', headers: { 'user-agent': bot } };

      sandbox.stub(request, 'get').returns(mockRequest(200, '<html></html>'));

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 200);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html></html>');
    });

    it('should call next() if the referer is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/search', 'user-agent': bot } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.status.callCount, 0);
      assert.equal(res.send.callCount, 0);
    });

    it('should return a prerendered response if the referer is not part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/profile/search', 'user-agent': bot } };

      sandbox.stub(request, 'get').returns(mockRequest(200, '<html></html>'));

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 200);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html></html>');
    });

    it('should return a prerendered response if a string is returned from beforeRender', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot } };

      prerender.set('beforeRender', function(req, done) {
        done(null, '<html>cached</html>');
      });

      prerender(req, res, next);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 200);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html>cached</html>');
    });

    it('should return a prerendered response if an object is returned from beforeRender', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot } };

      prerender.set('beforeRender', function(req, done) {
        done(null, {status: 400, body: '<html>Bad Request</html>'});
      });

      prerender(req, res, next);

      assert.equal(next.callCount, 0);
      assert.equal(res.status.callCount, 1);
      assert.equal(res.status.getCall(0).args[0], 400);
      assert.equal(res.send.callCount, 1);
      assert.equal(res.send.getCall(0).args[0], '<html>Bad Request</html>');
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
    it('should build the correct api url for the Heroku SSL Addon support with single value', function() {
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

    // Check X-Forwarded-Proto because Heroku SSL Support terminates at the load balancer
    it('should build the correct api url for the Heroku SSL Addon support with double value', function() {
      var req = {
        protocol: 'http',
        url: '/search?q=javascript',
        get: function(v){
          if(v === 'host') return 'google.com';
          if(v === 'X-Forwarded-Proto') return 'https,http';
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'http://service.prerender.io/https://google.com/search?q=javascript');
    });
  });
});
