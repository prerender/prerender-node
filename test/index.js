var assert = require('assert')
  , sinon = require('sinon')
  , prerender = require('../index')
  , bot = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
  , user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36';

describe('Prerender', function(){

  it('should return a prerendered response', function(){
    var req = { url: '/', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

    prerender(req, res, next);

    prerender.getPrerenderedPageResponse.restore();

    assert.equal(next.callCount, 0);
    assert.equal(res.send.callCount, 1);
    assert.equal(res.send.getCall(0).args[0], '<html></html>');
  });

  it('should return a prerendered response if user is a bot by checking for _escaped_fragment_', function(){
    var req = { url: '/path?_escaped_fragment_=', headers: { 'user-agent': user } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

    prerender(req, res, next);

    prerender.getPrerenderedPageResponse.restore();

    assert.equal(next.callCount, 0);
    assert.equal(res.send.callCount, 1);
    assert.equal(res.send.getCall(0).args[0], '<html></html>');
  });

  it('should call next() if the url is a bad url with _escaped_fragment_', function(){
    var req = { url: '/path?query=params?_escaped_fragment_=', headers: { 'user-agent': user } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender(req, res, next);
    
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should call next() if user is not a bot by checking agent string', function(){
    var req = { url: '/', headers: { 'user-agent': user } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender(req, res, next);
    
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should call next() if user is a bot, but the bot is requesting a resource file', function(){
    var req = { url: '/main.js?anyQueryParam=true', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender(req, res, next);
    
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should call next() if the url is not part of the regex specific whitelist', function(){
    var req = { url: '/saved/search/blah', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender.whitelisted(['^/search', '/help'])(req, res, next);
    
    delete prerender.whitelist;
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should return a prerendered response if the url is part of the regex specific whitelist', function(){
    var req = { url: '/search/things?query=blah', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

    prerender.whitelisted(['^/search.*query', '/help'])(req, res, next);

    prerender.getPrerenderedPageResponse.restore();

    delete prerender.whitelist;
    assert.equal(next.callCount, 0);
    assert.equal(res.send.callCount, 1);
    assert.equal(res.send.getCall(0).args[0], '<html></html>');
  });

  it('should call next() if the url is part of the regex specific blacklist', function(){
    var req = { url: '/search/things?query=blah', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender.blacklisted(['^/search', '/help'])(req, res, next);
    
    delete prerender.blacklist;
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should return a prerendered response if the url is not part of the regex specific blacklist', function(){
    var req = { url: '/profile/search/blah', headers: { 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

    prerender.blacklisted(['^/search', '/help'])(req, res, next);

    prerender.getPrerenderedPageResponse.restore();

    delete prerender.blacklist;
    assert.equal(next.callCount, 0);
    assert.equal(res.send.callCount, 1);
    assert.equal(res.send.getCall(0).args[0], '<html></html>');
  });

  it('should call next() if the referer is part of the regex specific blacklist', function(){
    var req = { url: '/api/results', headers: { referer: '/search', 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    prerender.blacklisted(['^/search', '/help'])(req, res, next);
    
    delete prerender.blacklist;
    assert.equal(next.callCount, 1);
    assert.equal(res.send.callCount, 0);
  });

  it('should return a prerendered response if the referer is not part of the regex specific blacklist', function(){
    var req = { url: '/api/results', headers: { referer: '/profile/search', 'user-agent': bot } },
      res = { send: sinon.stub() },
      next = sinon.stub();

    sinon.stub(prerender, 'getPrerenderedPageResponse').callsArgWith(1, {statusCode: 200, body: '<html></html>'});

    prerender.blacklisted(['^/search', '/help'])(req, res, next);

    prerender.getPrerenderedPageResponse.restore();

    delete prerender.blacklist;
    assert.equal(next.callCount, 0);
    assert.equal(res.send.callCount, 1);
    assert.equal(res.send.getCall(0).args[0], '<html></html>');
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
      var req = { protocol: 'https', get: function(){return 'google.com';}, url: '/search?q=javascript' };
      delete process.env.PRERENDER_SERVICE_URL;
      assert.equal(prerender.buildApiUrl(req), 'http://prerender.herokuapp.com/https://google.com/search?q=javascript');
    });

    it('should build the correct api url with an environment variable url', function(){
      var req = { protocol: 'https', get: function(){return 'google.com';}, url: '/search?q=javascript' };
      process.env.PRERENDER_SERVICE_URL = 'http://prerenderurl.com';
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/https://google.com/search?q=javascript');
      delete process.env.PRERENDER_SERVICE_URL;
    });

    it('should build the correct api url with an initialization variable url', function(){
      var req = { protocol: 'https', get: function(){return 'google.com';}, url: '/search?q=javascript' };
      prerender.set('prerenderServiceUrl', 'http://prerenderurl.com');
      assert.equal(prerender.buildApiUrl(req), 'http://prerenderurl.com/https://google.com/search?q=javascript');
      delete prerender.prerenderServiceUrl;
    });
  });
});