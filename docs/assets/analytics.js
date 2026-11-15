// Public browser-ingestion token supplied by the project owner, not a private API key.
export const PROJECT_TOKEN = 'phc_sgMd7DmW2DpKzST9HGn6wNYxXNuCb8ycdXH3b9amVF7S';
export const API_HOST = 'https://us.i.posthog.com';
const stateKey = '__utilitySuiteAnalytics';
const events = new Set(['calculation_succeeded', 'conversion_succeeded', 'conversion_failed', 'result_saved', 'saved_details_opened']);
const actions = new Set(['open_calculator', 'read_prd', 'view_status', 'view_evidence', 'view_log', 'view_roadmap', 'open_repository', 'calculate', 'convert', 'save_result', 'create_trip', 'open_saved_details', 'open_guidance', 'open_rate_source']);

export function environmentFor(hostname) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname) ? 'local' : 'production';
}
export function cleanUrl(value) {
  try { const url = new URL(value); return url.origin + url.pathname; }
  catch { return ''; }
}

export function configFor(context) {
  return {
    api_host: API_HOST,
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    // Explicit pageviews and allowlisted clicks avoid DOM text/value capture.
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    capture_exceptions: false,
    enable_recording_console_log: false,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      // Exclude sensitive DOM (including select options and evidence images),
      // rather than relying only on text masking for dynamic contents.
      blockSelector: '[data-analytics-private], .evidence, input, textarea, select, option',
      recordHeaders: false,
      recordBody: false,
      maskCapturedNetworkRequestFn: request => ({ ...request, name: cleanUrl(request.name), requestBody: undefined, responseBody: undefined }),
    },
    before_send: event => {
      if (!event) return event;
      // Never change replay chunks here: the recorder masks them in the browser.
      const properties = { ...event.properties, ...context };
      for (const key of ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer']) {
        if (key in properties) properties[key] = cleanUrl(properties[key]);
      }
      return { ...event, properties };
    },
  };
}

// Official project bootstrap supplied by the owner. Keep it independent of the
// calculator and load the SDK asynchronously; no SDK dependency is installed.
function bootstrap(document, window) {
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',p.onerror=function(){p=null},(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],Object.defineProperty(u,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e}}),Object.defineProperty(u.people,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+'.people (stub)'}}),o='Eh Rh Ph Oh Lh qh init yd bd dd fd Sd wc md xd ad Ed Ad Rd Pd Od Fd capture getExtension gr pd gd calculateEventProperties Ld register register_once register_for_session unregister unregister_for_session zd hd jd getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys onActiveMatchingSurveysChanged renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Hd identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset Ud shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty qd Td createPersonProfile setInternalOrTestUser Bd Uh zh opt_in_capturing opt_out_capturing Hh has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing $d debug kc Ls getPageViewId captureTraceFeedback captureTraceMetric rd'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
}

export function startAnalytics(surface, win = globalThis.window) {
  const noop = { track() {} };
  try {
    if (!win || !['product_page', 'calculator'].includes(surface)) return noop;
    if (win[stateKey]) return win[stateKey];
    const context = { environment: environmentFor(win.location.hostname), surface };
    const capture = (event, properties = {}) => {
      try { win.posthog?.capture(event, { ...properties, ...context }); } catch { /* Analytics must never break an action. */ }
    };
    const analytics = {
      track(event) { if (events.has(event)) capture(event); },
    };
    win[stateKey] = analytics;
    // Fail closed if another integration initialized PostHog: never duplicate or
    // send through an instance whose privacy configuration we don't control.
    if (win.posthog?.__loaded || win.posthog?._i?.length) { win[stateKey] = noop; return noop; }
    bootstrap(win.document, win);
    win.posthog.init(PROJECT_TOKEN, configFor(context));
    win.posthog.register(context);
    // Vite serves the live calculator at /; docs/app/ is the last generated build.
    if (context.environment === 'local' && surface === 'product_page') {
      for (const link of win.document.querySelectorAll?.('[data-analytics-action="open_calculator"]') ?? []) link.setAttribute('href', '/');
    }
    capture('$pageview', { $current_url: cleanUrl(win.location.href), $referrer: cleanUrl(win.document.referrer) });
    win.document.addEventListener('click', event => {
      try {
        const element = event.target?.closest?.('[data-analytics-action]');
        const action = element?.getAttribute('data-analytics-action');
        if (actions.has(action) && !element.disabled) capture('ui_clicked', { action });
      } catch { /* DOM/SDK failures cannot interrupt the original click. */ }
    });
    return analytics;
  } catch {
    try { if (win) win[stateKey] = noop; } catch { /* Unavailable globals. */ }
    return noop;
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  startAnalytics(document.body?.dataset.analyticsSurface);
}
