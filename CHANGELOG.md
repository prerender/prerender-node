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
