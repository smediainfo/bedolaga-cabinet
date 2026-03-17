/**
 * Captures Yandex Metrika Client ID for offline conversions.
 * Reads from localStorage only (set by useAnalyticsCounters on page load).
 * Never blocks — returns instantly.
 */

/**
 * Gets Yandex ClientID from localStorage.
 * useAnalyticsCounters saves CID there when Metrika initializes.
 * If Metrika is blocked, returns null instantly — no delays.
 */
export async function getYandexCid(): Promise<string | null> {
  try {
    return localStorage.getItem('yandex_cid');
  } catch {
    return null;
  }
}
