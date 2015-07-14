Prerender Node [![Stories in Ready](https://badge.waffle.io/prerender/prerender-node.png?label=ready&title=Ready)](https://waffle.io/prerender/prerender-node) [![Build Status](https://travis-ci.org/prerender/prerender-node.png)](https://travis-ci.org/prerender/prerender-node) [![NPM version](https://badge.fury.io/js/prerender-node.png)](http://badge.fury.io/js/prerender-node)
===========================

Google, Facebook, Twitter, Yahoo, and Bing are constantly trying to view your website... but they don't execute JavaScript. That's why we built Prerender. Prerender is perfect for AngularJS SEO, BackboneJS SEO, EmberJS SEO, and any other JavaScript framework.

This middleware intercepts requests to your Node.js website from crawlers, and then makes a call to the (external) Prerender Service to get the static HTML instead of the JavaScript for that page.

Prerender adheres to google's `_escaped_fragment_` proposal, which we recommend you use. It's easy:
- Just add &lt;meta name="fragment" content="!"> to the &lt;head> of all of your pages
- If you use hash urls (#), change them to the hash-bang (#!)
- That's it! Perfect SEO on JavaScript pages.

via npm:

    $ npm install prerender-node --save

And when you set up your express app, add:

```js
app.use(require('prerender-node'));
```

or if you have an account on [prerender.io](http://prerender.io) and want to use your token:

```js
app.use(require('prerender-node').set('prerenderToken', 'YOUR_TOKEN'));
```

`Note` If you're testing locally, you'll need to run the [prerender server](https://github.com/prerender/prerender) locally so that it has access to your server.

This middleware is tested with Express3 and Express4, but has no explicit dependency on either.

## Testing

If your URLs use a hash-bang:

	If you want to see `http://localhost:3000/#!/profiles/1234`
	Then go to `http://localhost:3000/?_escaped_fragment_=/profiles/1234`

If your URLs use push-state:

	If you want to see `http://localhost:3000/profiles/1234`
	Then go to `http://localhost:3000/profiles/1234?_escaped_fragment_=`

## How it works
1. The middleware checks to make sure we should show a prerendered page
	1. The middleware checks if the request is from a crawler (`_escaped_fragment_` or agent string)
	2. The middleware checks to make sure we aren't requesting a resource (js, css, etc...)
	3. (optional) The middleware checks to make sure the url is in the whitelist
	4. (optional) The middleware checks to make sure the url isn't in the blacklist
2. The middleware makes a `GET` request to the [prerender service](https://github.com/prerender/prerender) (phantomjs server) for the page's prerendered HTML
3. Return that HTML to the crawler

# Customization

### Whitelist

Whitelist a single url path or multiple url paths. Compares using regex, so be specific when possible. If a whitelist is supplied, only urls containing a whitelist path will be prerendered.
```js
app.use(require('prerender-node').whitelisted('^/search'));
```
```js
app.use(require('prerender-node').whitelisted(['/search', '/users/.*/profile']));
```

### Blacklist

Blacklist a single url path or multiple url paths. Compares using regex, so be specific when possible. If a blacklist is supplied, all url's will be prerendered except ones containing a blacklist path.
```js
app.use(require('prerender-node').blacklisted('^/search'));
```
```js
app.use(require('prerender-node').blacklisted(['/search', '/users/.*/profile']));
```

### beforeRender

This method is intended to be used for caching, but could be used to save analytics or anything else you need to do for each crawler request. If you return a string from beforeRender, the middleware will serve that to the crawler (with status `200`) instead of making a request to the prerender service. If you return an object the middleware will look for a `status` and `body` property (defaulting to `200` and `""` respectively) and serve those instead.
```js
app.use(require('prerender-node').set('beforeRender', function(req, done) {
	// do whatever you need to do
	done();
}));
```

### afterRender

This method is intended to be used for caching, but could be used to save analytics or anything else you need to do for each crawler request. This method is a noop and is called after the prerender service returns HTML.
```js
app.use(require('prerender-node').set('afterRender', function(err, req, prerender_res) {
	// do whatever you need to do
}));
```

### protocol

Option to hard-set the protocol. Useful for sites that are available on both http and https.
```js
app.use(require('prerender-node').set('protocol', 'https'));
```

## Caching

This express middleware is ready to be used with [redis](http://redis.io/) or [memcached](http://memcached.org/) to return prerendered pages in milliseconds.

When setting up the middleware, you can add a `beforeRender` function and `afterRender` function for caching.

Here's an example testing a local redis cache:

	$ npm install redis

```js
var redis = require("redis"),
	client = redis.createClient();

prerender.set('beforeRender', function(req, done) {
	client.get(req.url, done);
}).set('afterRender', function(err, req, prerender_res) {
	client.set(req.url, prerender_res.body)
});
```

or

```js
var redis = require("redis"),
client = redis.createClient(),
cacheableStatusCodes = {200: true, 302: true, 404: true};

prerender.set('beforeRender', function(req, done) {
  client.hmget(req.url, 'body', 'status', function (err, fields) {
    if (err) return done(err);
    done(err, {body: fields[0], status: fields[1]});
  });
}).set('afterRender', function(err, req, prerender_res) {
  // Don't cache responses that might be temporary like 500 or 504.
  if (cacheableStatusCodes[prerender_res.statusCode]) {
    client.hmset(req.url, 'body', prerender_res.body, 'status', prerender_res.statusCode);
  }
});
```


## Using your own prerender service

We host a Prerender server at [prerender.io](http://prerender.io) so that you can work on more important things, but if you've deployed the prerender service on your own... set the `PRERENDER_SERVICE_URL` environment variable so that this middleware points there instead. Otherwise, it will default to the service already deployed by [prerender.io](http://prerender.io).

	$ export PRERENDER_SERVICE_URL=<new url>

Or on heroku:

	$ heroku config:set PRERENDER_SERVICE_URL=<new url>

As an alternative, you can pass `prerender_service_url` in the options object during initialization of the middleware

```js
app.use(require('prerender-node').set('prerenderServiceUrl', '<new url>'));
```

## Contributing

We love any contributions! Feel free to create issues, pull requests, or middleware for other languages/frameworks!

## License

The MIT License (MIT)

Copyright (c) 2013 Todd Hooper &lt;todd@prerender.io&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
