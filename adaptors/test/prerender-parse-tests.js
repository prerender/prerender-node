var ParseMock = {
  Cloud: {
    config: {},
    httpRequest: function(options) {
      config = options;
    }
  }
};

var assert = require('assert')
  , sinon = require('sinon')
  , prerender = require('../../index')
  , parseAdaptor = require('../prerender-parse')
  , user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36';


describe('Prerender Parse Adaptor', function() {
  var adaptor = parseAdaptor(ParseMock);

  it('should set parse adaptor', function() {
    assert.notEqual(prerender.adaptor, adaptor);
    prerender.setAdaptor(adaptor);
    assert.equal(prerender.adaptor, adaptor);
  });

  it('should make parse http call', function() {
    var req = {
      method: 'GET',
      url: '/path?_escaped_fragment_=',
      headers: { 'user-agent': user },
      protocol: 'https',
      get: function(v) {
        if(v === 'host') return 'google.com';
      }
    };

    var spy = sinon.spy(ParseMock.Cloud, "httpRequest");
    prerender.setAdaptor(adaptor);
    prerender.getPrerenderedPageResponse(req);
    assert(spy.called);
    ParseMock.Cloud.httpRequest.restore();
  });

});
