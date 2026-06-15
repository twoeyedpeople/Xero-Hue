type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: AnalyticsEventParams) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-TBD0VPNM7B";

export function trackEvent(eventName: string, params?: AnalyticsEventParams): void {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", eventName, params);
}
