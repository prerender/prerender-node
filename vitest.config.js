const { defineConfig } = require('vitest/config');

delete process.env.PRERENDER_SERVICE_URL;

module.exports = defineConfig({
  test: {
    include: ['test/**/*-spec.js'],
    // Both Express support apps listen on the same fixed port at require time.
    fileParallelism: false,
  },
});
