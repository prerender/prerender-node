## 2.0.0 (2015-07-15)

Bugfixes:

  - Stop swallowing errors if the prerender service fails.

    Before: If the prerender service errors out (e.g., not available and the request times out), the error is swallowed and `next` called with no args.

    After: error is passed through to `next`, and `prerender.afterRenderFn` is handed `err` as the first arg. Makes it much easier to know if you're misconfiguring something or forgot to start the prerender server locally when testing.

## 2.0.1 (2015-07-20)

Bugfixes:

  - Send HTTPS URLs through correctly.

    Fixed an issue where `http` was always added to the URLs sent to Prerender even if the URL was https.