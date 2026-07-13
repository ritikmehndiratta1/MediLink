import posthog from "posthog-js";

const key = import.meta.env.VITE_POSTHOG_KEY;

export function initPosthog() {
  if (!key || posthog.__loaded) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
}

export default posthog;
