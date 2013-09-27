Prerender Node
=========================== 

This npm package installs express middleware that prerenders a javascript-rendered page and returns the HTML to a search engine crawler for SEO. It checks the agent string on the request for a crawler, and continues on to your normal routes if the requester is not a crawler.

## How it works
* Check to make sure the request is from a crawler and we aren't requesting a resource (js, css, etc...)
* Make a `GET` request to the [prerender service](https://github.com/collectiveip/prerender) for the page's prerendered HTML
* Return that HTML to the crawler

## Installation

via npm:

    $ npm install prerender-node

## Usage

When you set up your express app, add:

```js
app.use(require('prerender-node'));
```

If you've deployed the prerender service on your own, set the `PRERENDER_URL` environment variable so that this package points there instead. Otherwise, it will default to the service already deployed at `http://prerender.herokuapp.com`

	$ export PRERENDER_URL=<new url>

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

The MIT License (MIT)

Copyright (c) 2013 Todd Hooper &lt;todd@collectiveip.com&gt;

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