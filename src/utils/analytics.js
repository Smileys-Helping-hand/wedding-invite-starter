const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_API = 'https://plausible.io/api/event';

/**
 * Track an interaction with Plausible if configured.
 * @param {string} name Event name.
 * @param {Record<string, any>} [props] Additional properties.
 */
export const trackEvent = (name, props = {}) => {
  if (!PLAUSIBLE_DOMAIN || typeof window === 'undefined') return;

  window.fetch(PLAUSIBLE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      url: window.location.href,
      domain: PLAUSIBLE_DOMAIN,
      ...('referrer' in props ? { referrer: props.referrer } : {}),
      props,
    }),
    keepalive: true,
  });
};

export default trackEvent;
