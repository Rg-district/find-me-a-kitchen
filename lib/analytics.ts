/**
 * FMAK Analytics — GA4 event helpers via direct gtag
 * GTM bypassed (tags flagged by Google malware scanner — April 2026)
 * Events fire directly to GA4 property G-GP324NBFEJ
 */

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
    _gtag: (...args: any[]) => void
    gtag: (...args: any[]) => void
  }
}

function track(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return
  try {
    const fn = window.gtag || window._gtag
    if (fn) {
      fn('event', eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (e) {
    // Silently fail — never break UX for analytics
  }
}

/** User submits email to receive AI match results */
export function trackEmailCapture(sourcePage: string) {
  track('email_capture_results', {
    source_page: sourcePage,
    user_type: 'food_maker',
  })
}

/** User successfully creates an account */
export function trackSignUpComplete(sourcePage: string) {
  track('sign_up_complete', {
    source_page: sourcePage,
    user_type: 'food_maker',
  })
}

/** Kitchen owner submits listing inquiry */
export function trackListingInquiry(sourcePage: string) {
  track('listing_inquiry', {
    source_page: sourcePage,
    user_type: 'kitchen_owner',
  })
}

/** User downloads a guide */
export function trackGuideDownload(sourcePage: string, guideName?: string) {
  track('guide_download', {
    source_page: sourcePage,
    user_type: 'food_maker',
    guide_name: guideName || 'unknown',
  })
}
