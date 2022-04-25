Prerender Node [![Build Status](https://travis-ci.org/prerender/prerender-node.png)](https://travis-ci.org/prerender/prerender-node) [![NPM version](https://badge.fury.io/js/prerender-node.png)](http://badge.fury.io/js/prerender-node)
===========================

Google, Facebook, Twitter, and Bing are constantly trying to view your website... but Google is the only crawler that executes a meaningful amount of JavaScript and Google even admits that they can execute JavaScript weeks after actually crawling. Prerender allows you to serve the full HTML of your website back to Google and other crawlers so that they don't have to execute any JavaScript. [Google recommends using Prerender.io](https://developers.google.com/search/docs/guides/dynamic-rendering) to prevent indexation issues on sites with large amounts of JavaScript.

Prerender is perfect for Angular SEO, React SEO, Vue SEO, and any other JavaScript framework.

This middleware intercepts requests to your Node.js website from crawlers, and then makes a call to the (external) Prerender Service to get the static HTML instead of the JavaScript for that page. That HTML is then returned to the crawler.

via npm:

    $ npm install prerender-node --save

And when you set up your express app, add:

```js
app.use(require('prerender-node'));
```

or if you have an account on [prerender.io](https://prerender.io/) and want to use your token:

```js
app.use(require('prerender-node').set('prerenderToken', 'YOUR_TOKEN'));
```

`Note` If you're testing locally, you'll need to run the [prerender server](https://github.com/prerender/prerender) locally so that it has access to your server.

This middleware is tested with Express3 and Express4, but has no explicit dependency on either.

## Testing

The best way to test the prerendered page is to [set the User Agent of your browser to Googlebot's user agent](https://developers.google.com/web/tools/chrome-devtools/device-mode/override-user-agent) and visit your URL directly. If you View Source on that URL, you should see the static HTML version of the page with the `<script>` tags removed from the page. If you still see `<script>` tags then that means the middleware isn't set up properly yet.

`Note` If you're testing locally, you'll need to run the [prerender server](https://github.com/prerender/prerender) locally so that it has access to your server.

## How it works
1. The middleware checks to make sure we should show a prerendered page
	1. The middleware checks if the request is from a crawler by checking the user agent string against a default list of crawler user agents
	2. The middleware checks to make sure we aren't requesting a resource (js, css, etc...)
	3. (optional) The middleware checks to make sure the url is in the whitelist
	4. (optional) The middleware checks to make sure the url isn't in the blacklist
2. The middleware makes a `GET` request to the [prerender service](https://github.com/prerender/prerender) for the page's prerendered HTML
3. Return that HTML to the crawler from your server

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

This method is intended to be used for caching, but could be used to save analytics or anything else you need to do for each crawler request. This method is called after the prerender service returns HTML.
```js
app.use(require('prerender-node').set('afterRender', function(err, req, prerender_res) {
	// do whatever you need to do
}));
```

You can also use `afterRender` to cancel the prerendered response and skip to the next middleware. For example, you may want to implement your own fallback behaviour for when Prerender returns errors or if the HTML is missing expected content. To cancel the render, return an object containing `cancelRender: true` from `afterRender`:

```js
app.use(require('prerender-node').set('afterRender', function(err, req, prerender_res) {
	if (err) {
		return { cancelRender: true };
	}
}));
```

### protocol

Option to hard-set the protocol. Useful for sites that are available on both http and https.
```js
app.use(require('prerender-node').set('protocol', 'https'));
```

### host

Option to hard-set the host. Useful for sites that are behind a load balancer or internal reverse proxy.
For example, your internal URL looks like `http://internal-host.com/` and you might want it to instead send
a request to Prerender.io with your real domain in place of `internal-host.com`.
```js
app.use(require('prerender-node').set('host', 'example.com'));
```

### forwardHeaders

Option to forward headers from request to prerender.
```js
app.use(require('prerender-node').set('forwardHeaders', true));
```

### prerenderServerRequestOptions

Option to add options to the request sent to the prerender server.
```js
app.use(require('prerender-node').set('prerenderServerRequestOptions', {}));
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

We host a Prerender server at [prerender.io](https://prerender.io/) so that you can work on more important things, but if you've deployed the prerender service on your own... set the `PRERENDER_SERVICE_URL` environment variable so that this middleware points there instead. Otherwise, it will default to the service already deployed by [prerender.io](https://prerender.io/).

	$ export PRERENDER_SERVICE_URL=<new url>

Or on heroku:

	$ heroku config:set PRERENDER_SERVICE_URL=<new url>

As an alternative, you can pass `prerenderServiceUrl` in the options object during initialization of the middleware

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
