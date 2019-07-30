## 3.2.5 (2019-07-30)
Changed:

  - Updated lodash and mocha to resolve security vulnerability warning

## 3.2.4 (2019-04-08)
Changed:

  - Updated devDependencies to latest versions for running tests

## 3.2.3 (2019-04-08)
Changed:

  - Modified request dependency from ^2.83.0 to ^2.88.0 and added package-lock.json file

## 3.2.2 (2019-03-27)
Added:

  - Added Chrome-Lighthouse user agent so Google page speed insight tool will show prerendered pages

## 3.2.1 (2018-08-29)
Added:

  - Looks like I accidentally added `yahoo` instead of `yandex` in the last commit. Fixing that by adding yandex now

## 3.2.0 (2018-07-18)
Added:

  - Added Googlebot, Bingbot, and Yandex to user agent check for new Dynamic Rendering and phase-out of escaped fragment URLs
  - Added check for x-prerender header for mobile adaptive feature for websites that serve different HTML to mobile vs desktop crawlers

## 3.1.1 (2018-03-01)
Changed:

  - Fixing test that checked for the old endpoint

## 3.1.0 (2018-03-01)
Changed:

  - Point to https endpoint for prerender service instead of http

## 3.0.0 (2018-03-01)
Removed:

  - Node 0.10 support
  - Node 0.12 support

Changed:

  - Bumped request dependency version

Added:

  - Node 8 to travis.yml

## 2.8.0 (2018-02-21)
Added:

  - Added Bitrix24 and Xing user agents.

## 2.7.4 (2017-09-22)
Changed:

  - Fixing wrong version of request. :)

## 2.7.3 (2017-09-22)
Changed:

  - Pinned node request module to 2.81.1 since they bumped a dependency version that required a newer version of node. prerender-node still supports older versions of node so pinned an earlier version of request until we officially dont support older versions of node.

## 2.7.2 (2017-07-05)
New features:

  - Added pinterestbot to user agents being checked.

## 2.7.1 (2017-04-13)
New features:

  - Added Qwantify to user agents being checked.

Changed

  - Added `host` parameter documentation to README

## 2.7.0 (2016-12-20)
New features:

  - Adds an option to be able to pass options to the request sent to the prerender.


## 2.6.0 (2016-12-13)
New features:

  - Check for Google Page Speed user agent in order to send prerendered pages when URLs are tested through their tool

Changed

 - extensionsToIgnore check is now case insensitive

## 2.5.0 (2016-10-26)

Changed

 - When creating the URL to send to Prerender, check to see if `x-forwarded-host` is set and use that before using the `host` header.

## 2.4.0 (2016-8-30)

New features:

  - Check for Skype user agent in order to send prerendered pages when URLs are shared through Skype chat
  - Check for nuzzel user agent
  - Check for discordbot user agent

Changed

 - Don't send the `host` header if `forwardHeaders` is enabled to prevent issues with servers that take the Host header and apply it to the URL

## 2.3.0 (2016-6-1)

New features:

  - Check for Tumblr user agent in order to send prerendered pages when URLs are shared through Tumblr
  - Check for bitlybot user agent in order to send prerendered pages when URLs are shared through Bitly

## 2.2.2 (2016-5-8)

Bugfixes:

  - fix compatibility with Node.js v6.0.0

## 2.2.1 (2016-3-21)

Bugfixes:

  - Check for more specific pinterest crawler user agent since their iOS app changes the browser user agent to include "pinterest"
  - Added svg to list of extensions to check

## 2.2.0 (2015-12-29)

New features:

  - Check for Whatsapp user agent in order to send prerendered pages when URLs are shared through Whatsapp

## 2.1.0 (2015-09-17)

New features:

  - Check for Applebot user agent in order to send prerendered pages to apple for Siri on iOS9

## 2.0.2 (2015-07-24)

Bugfixes:

  - Make sure we pass through the error, request, and Prerender response to afterRender

    Fixed an issue where the original request and Prerender response wasn't getting passed to afterRender after recent change to pass err through. Now works correctly: `afterRender(err, req, prerenderResponse)`

## 2.0.1 (2015-07-20)

Bugfixes:

  - Send HTTPS URLs through correctly.

    Fixed an issue where `http` was always added to the URLs sent to Prerender even if the URL was https.

## 2.0.0 (2015-07-15)

Bugfixes:

  - Stop swallowing errors if the prerender service fails.

    Before: If the prerender service errors out (e.g., not available and the request times out), the error is swallowed and `next` called with no args.

    After: error is passed through to `next`, and `prerender.afterRenderFn` is handed `err` as the first arg. Makes it much easier to know if you're misconfiguring something or forgot to start the prerender server locally when testing.
