const { PostHog } = require("posthog-node");

const posthog = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    })
  : null;

// No-op capture when PostHog isn't configured (e.g. local dev without a key)
// so call sites never need to guard against a missing client.
function capture(event) {
  if (!posthog) return;
  posthog.capture(event);
}

module.exports = { posthog, capture };
