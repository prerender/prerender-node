var supertest = require('supertest')
  , nock = require('nock')
  , request = require('request');

describe('prerender-node in Express 3', function(){

  it('responds with prerendered content', function(done){
    var expectedGETregex = /\/http:\/\/127.0.0.1:[0-9]*\/\?_escaped_fragment_=/

    mockRequestToPrerenderService = nock('https://service.prerender.io')
      .filteringPath(function(path){
        return '/';
      })
      .filteringPath(expectedGETregex, '/replace-me')
      .get('/replace-me')
      .reply(200, 'cached content')

    app = require('./support/express3/app');
    supertest(app)
      .get('/?_escaped_fragment_=')
      .set('User-Agent', "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
      .expect(200)
      .expect('cached content')
      .end(function(err){
        mockRequestToPrerenderService.done();
        app.serverForTests.close();
        done(err);
      })
  });
});
