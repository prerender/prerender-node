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