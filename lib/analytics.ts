/**
 * FMAK Analytics — GA4 event helpers via GTM dataLayer
 * Events fire through GTM → GA4 (GTM-M3PTV54F)
 */

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

function push(event: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event,
    ...params,
    timestamp: new Date().toISOString(),
  })
}

/** User submits email to receive AI match results */
export function trackEmailCapture(sourcePage: string) {
  push('email_capture_results', {
    source_page: sourcePage,
    user_type: 'food_maker',
  })
}

/** User successfully creates an account */
export function trackSignUpComplete(sourcePage: string) {
  push('sign_up_complete', {
    source_page: sourcePage,
    user_type: 'food_maker',
  })
}

/** Kitchen owner submits listing inquiry */
export function trackListingInquiry(sourcePage: string) {
  push('listing_inquiry', {
    source_page: sourcePage,
    user_type: 'kitchen_owner',
  })
}

/** User downloads a guide */
export function trackGuideDownload(sourcePage: string, guideName?: string) {
  push('guide_download', {
    source_page: sourcePage,
    user_type: 'food_maker',
    guide_name: guideName || 'unknown',
  })
}
