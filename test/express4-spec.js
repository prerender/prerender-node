import { describe, it } from 'vitest';

var assert = require('assert')
  , supertest = require('supertest')
  , nock = require('nock')
  , request = require('request');

describe('prerender-node in Express 4', function(){

  it('responds with prerendered content', async function(){
    var expectedGETregex = /\/http:\/\/127.0.0.1:[0-9]*\/\?_escaped_fragment_=/

    var mockRequestToPrerenderService = nock('https://service.prerender.io')
      .filteringPath(function(path){
        return '/';
      })
      .filteringPath(expectedGETregex, '/replace-me')
      .get('/replace-me')
      .reply(200, 'cached content')

    var app = require('./support/express4/app');
    var err = await new Promise(function(resolve){
      supertest(app)
        .get('/?_escaped_fragment_=')
        .set('User-Agent', "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
        .expect(200)
        .expect('cached content')
        .end(resolve);
    });

    mockRequestToPrerenderService.done();
    app.serverForTests.close();
    assert.ifError(err);
  });
});
