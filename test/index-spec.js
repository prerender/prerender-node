var assert = require('assert')
  , sinon = require('sinon')
  , nock = require('nock')
  , prerender = require('../index')
  , request    = require('request')
  , zlib = require('zlib')
  , bot = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
  , user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36';

describe ('Prerender', function(){

  describe('#prerender', function(){

    var sandbox, res, next;

    beforeEach(function () {

      sandbox = sinon.createSandbox();

      prerender.prerenderToken = 'MY_TOKEN';
      res = { writeHead: sandbox.stub(), end: sandbox.stub() };
      next = sandbox.stub();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return a prerendered response with the returned status code and headers', function(done){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      }).get('/http://google.com/')
      .reply(301, '<html></html>', {
        Location: 'http://google.com'
      });

      res.end = sandbox.spy(function(){
        assert.equal(next.callCount, 0);
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.end.callCount, 1);
        assert.deepEqual(res.writeHead.getCall(0).args[1], { 'location': 'http://google.com'});
        assert.equal(res.end.getCall(0).args[0], '<html></html>');
        assert.equal(res.writeHead.getCall(0).args[0], 301);
        done();
      });

      prerender(req, res, next);

    });


    it('should return a prerendered response if user is a bot by checking for _escaped_fragment_', function(done){
      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      })
      .get('/http://google.com/path')
      .query({_escaped_fragment_: ''})
      .reply(200, '<html></html>');

      res.end = sandbox.spy(function(){
        assert.equal(next.callCount, 0);
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.writeHead.getCall(0).args[0], 200);
        assert.equal(res.end.callCount, 1);
        assert.equal(res.end.getCall(0).args[0], '<html></html>');
        done();
      });

      prerender(req, res, next);

    });

    it('should return a prerendered gzipped response', function(done){
      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user, host: 'google.com' }, connection: { encrypted: false } };

      res.end = function (content) {
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.writeHead.getCall(0).args[0], 200);
        assert.equal(next.callCount, 0);
        assert.equal(content, '<html></html>');
        done();
      };

      zlib.gzip(Buffer.from('<html></html>', 'utf-8'), function (err, zipped) {
        nock('https://service.prerender.io', {
          reqheaders: {
            'x-prerender-token': 'MY_TOKEN',
            'Accept-Encoding': 'gzip'
          }
        })
        .get('/http://google.com/path')
        .query({_escaped_fragment_: ''})
        .reply(200, [zipped], {'content-encoding': 'gzip'});

        prerender(req, res, next);
      });

    });

    it('should call next() if the url is a bad url with _escaped_fragment_', function(){
      var req = { method: 'GET', url: '/path?query=params?_escaped_fragment_=', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should call next() if the request is not a GET', function(){
      var req = { method: 'POST', url: '/path', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should call next() if user is not a bot by checking agent string', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': user } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should call next() if user is a bot, but the bot is requesting a resource file', function(){
      var req = { method: 'GET', url: '/main.js?anyQueryParam=true', headers: { 'user-agent': bot } };

      prerender(req, res, next);

      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should call next() if the url is not part of the regex specific whitelist', function(){
      var req = { method: 'GET', url: '/saved/search/blah?_escaped_fragment_=', headers: { 'user-agent': bot }, connection: { encrypted: false } };

      prerender.whitelisted(['^/search', '/help'])(req, res, next);

      delete prerender.whitelist;
      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should return a prerendered response if the url is part of the regex specific whitelist', function(done){
      var req = { method: 'GET', url: '/search/things?query=blah&_escaped_fragment_=', headers: { 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      })
      .get('/http://google.com/search/things')
      .query({
        _escaped_fragment_: '',
        query: 'blah'
      })
      .reply(200, '<html></html>');

      res.end = sandbox.spy(function(){
        assert.equal(next.callCount, 0);
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.writeHead.getCall(0).args[0], 200);
        assert.equal(res.end.callCount, 1);
        assert.equal(res.end.getCall(0).args[0], '<html></html>');
        done();
      });

      prerender.whitelisted(['^/search.*query', '/help'])(req, res, next);
      delete prerender.whitelist;

    });

    it('should call next() if the url is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/search/things?query=blah', headers: { 'user-agent': bot }, connection: { encrypted: false } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should return a prerendered response if the url is not part of the regex specific blacklist', function(done){
      var req = { method: 'GET', url: '/profile/search/blah', headers: { 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };


      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      })
      .get('/http://google.com/profile/search/blah')
      .reply(200, '<html></html>');

      res.end = sandbox.spy(function(){
        assert.equal(next.callCount, 0);
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.writeHead.getCall(0).args[0], 200);
        assert.equal(res.end.callCount, 1);
        assert.equal(res.end.getCall(0).args[0], '<html></html>');
        done();
      });

      prerender.blacklisted(['^/search', '/help'])(req, res, next);
      delete prerender.blacklist;

    });

    it('should call next() if the referer is part of the regex specific blacklist', function(){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/search', 'user-agent': bot }, connection: { encrypted: false } };

      prerender.blacklisted(['^/search', '/help'])(req, res, next);

      delete prerender.blacklist;
      assert.equal(next.callCount, 1);
      assert.equal(res.writeHead.callCount, 0);
      assert.equal(res.end.callCount, 0);
    });

    it('should return a prerendered response if the referer is not part of the regex specific blacklist', function(done){
      var req = { method: 'GET', url: '/api/results', headers: { referer: '/profile/search', 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      })
      .get('/http://google.com/api/results')
      .reply(200, '<html></html>');

      res.end = sandbox.spy(function(){
        assert.equal(next.callCount, 0);
        assert.equal(res.writeHead.callCount, 1);
        assert.equal(res.writeHead.getCall(0).args[0], 200);
        assert.equal(res.end.callCount, 1);
        assert.equal(res.end.getCall(0).args[0], '<html></html>');
        done();
      });

      prerender.blacklisted(['^/search', '/help'])(req, res, next);
      delete prerender.blacklist;

    });

    it('should return a prerendered response if a string is returned from beforeRender', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot }, connection: { encrypted: false } };

      prerender.set('beforeRender', function(req, done) {
        done(null, '<html>cached</html>');
      });

      prerender(req, res, next);

      prerender.set('beforeRender', null);
      assert.equal(next.callCount, 0);
      assert.equal(res.writeHead.callCount, 1);
      assert.equal(res.writeHead.getCall(0).args[0], 200);
      assert.equal(res.end.callCount, 1);
      assert.equal(res.end.getCall(0).args[0], '<html>cached</html>');
    });

    it('should return a prerendered response if an object is returned from beforeRender', function(){
      var req = { method: 'GET', url: '/', headers: { 'user-agent': bot }, connection: { encrypted: false } };

      prerender.set('beforeRender', function(req, done) {
        done(null, {status: 400, body: '<html>Bad Request</html>'});
      });

      prerender(req, res, next);

      prerender.set('beforeRender', null);
      assert.equal(next.callCount, 0);
      assert.equal(res.writeHead.callCount, 1);
      assert.equal(res.writeHead.getCall(0).args[0], 400);
      assert.equal(res.end.callCount, 1);
      assert.equal(res.end.getCall(0).args[0], '<html>Bad Request</html>');
    });

    it('calls afterRender with error if the prerender service is unavailable', function(done){
      var req = { method: 'GET', url: '/fail', headers: { 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io')
      .get('/http://google.com/fail')
      .replyWithError('uh oh');

      var afterRenderStub = sandbox.stub();

      prerender.set('afterRender', afterRenderStub);

      prerender(req, res, function(err){
        prerender.set('afterRender', null);
        assert.equal(afterRenderStub.callCount, 1);
        assert.equal(afterRenderStub.getCall(0).args[0], err);
        done();
      });
    });

    it('calls afterRender with request and prerender response', function(done){
      var req = { method: 'GET', url: '/path?_escaped_fragment_=', headers: { 'user-agent': user, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io', {
        reqheaders: {
          'x-prerender-token': 'MY_TOKEN',
          'Accept-Encoding': 'gzip'
        }
      })
      .get('/http://google.com/path')
      .query({_escaped_fragment_: ''})
      .reply(200, '<html></html>');

      var afterRenderStub = sandbox.stub();
      var getPrerenderedPageResponseOriginal = prerender.getPrerenderedPageResponse;
      var prerenderResponseSpy = null;

      prerender.getPrerenderedPageResponse = function(req, callback) {
        prerenderResponseSpy = sandbox.spy(callback);
        getPrerenderedPageResponseOriginal.apply(prerender, [req, prerenderResponseSpy]);
      };

      prerender.set('afterRender', afterRenderStub);

      res.end = sandbox.spy(function(){
        prerender.set('afterRender', null);
        prerender.getPrerenderedPageResponse = getPrerenderedPageResponseOriginal;
        assert.equal(next.callCount, 0);
        assert.equal(afterRenderStub.getCall(0).args[0], null);
        assert.equal(afterRenderStub.getCall(0).args[1], req);
        assert.equal(afterRenderStub.getCall(0).args[2], prerenderResponseSpy.getCall(0).args[1]);
        done();
      });

      prerender(req, res, next);
    });

    it('calls next with error if the prerender service is unavailable', function(done){
      var req = { method: 'GET', url: '/fail', headers: { 'user-agent': bot, host: 'google.com' }, connection: { encrypted: false } };

      nock('https://service.prerender.io')
      .get('/http://google.com/fail')
      .replyWithError('uh oh');

      prerender(req, res, function(err){
        assert.equal(err.message, 'uh oh');
        assert.equal(res.writeHead.callCount, 0);
        assert.equal(res.end.callCount, 0);
        done();
      });
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
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com'
        },
        connection: {
          encrypted: false
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'https://service.prerender.io/http://google.com/search?q=javascript');
    });

    it('should build the correct api url with an environment variable url', function(){
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com'
        },
        connection: {
          encrypted: false
        }
      };

      process.env.PRERENDER_SERVICE_URL = 'http://prerenderurl.com';
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/http://google.com/search?q=javascript');
      delete process.env.PRERENDER_SERVICE_URL;
    });

    it('should build the correct api url with an initialization variable url', function(){
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com'
        },
        connection: {
          encrypted: false
        }
      };

      prerender.set('prerenderServiceUrl', 'http://prerenderurl.com');
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/http://google.com/search?q=javascript');
      delete prerender.prerenderServiceUrl;
    });

    // Check CF-Visitor header in order to Work behind CloudFlare with Flexible SSL (https://support.cloudflare.com/hc/en-us/articles/200170536)
    it('should build the correct api url for the Cloudflare Flexible SSL support', function(){
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com',
          'cf-visitor': '"scheme":"https"'
        },
        connection: {
          encrypted: false
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'https://service.prerender.io/https://google.com/search?q=javascript');
    });

    // Check X-Forwarded-Proto because Heroku SSL Support terminates at the load balancer
    it('should build the correct api url for the Heroku SSL Addon support with single value', function() {
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com',
          'x-forwarded-proto': 'https'
        },
        connection: {
          encrypted: false
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'https://service.prerender.io/https://google.com/search?q=javascript');
    });

    // Check X-Forwarded-Proto because Heroku SSL Support terminates at the load balancer
    it('should build the correct api url for the Heroku SSL Addon support with double value', function() {
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com',
          'x-forwarded-proto': 'https,http'
        },
        connection: {
          encrypted: false
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'https://service.prerender.io/https://google.com/search?q=javascript');
    });


    it('should build the correct api url for https URLs', function() {
      var req = {
        url: '/search?q=javascript',
        headers: {
          'host': 'google.com'
        },
        connection: {
          encrypted: true
        }
      };

      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'https://service.prerender.io/https://google.com/search?q=javascript');
    });
  });

  describe('#shouldShowPrerenderedPage', function() {
    it('returns true if bot is redditbot', function() {
      var req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; redditbot/1.0; +http://www.reddit.com/feedback)'
        },
        method: 'GET',
        url: '/'
      };

      assert(prerender.shouldShowPrerenderedPage(req));

    });

    it('returns false if x-prerender header is present', function() {
      var req = {
        headers: {
          'x-prerender': '1'
        },
        method: 'GET',
        url: '/'
      };

      assert.equal(false, prerender.shouldShowPrerenderedPage(req));

    });
  });
});
