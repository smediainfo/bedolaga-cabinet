/**
 * Yandex Metrika ClientID helpers.
 *
 * Lives in `utils/` (not `hooks/`) so that both the `api/` layer
 * (auth.ts, oauth.ts) and React hooks can read the cached CID
 * without `api/` accidentally importing from `hooks/`.
 */

const STORAGE_KEY = 'ym_client_id';

export function getYandexCid(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setYandexCid(cid: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, cid);
  } catch {
    /* sandboxed iframe / private mode -- ignore */
  }
}

/**
 * Yandex Direct click id (yclid) helpers.
 *
 * Arrives in the landing page URL as `?yclid=...` (a numeric string) and is
 * sent alongside the Metrika ClientID for Yandex offline conversions.
 */

const YCLID_KEY = 'ya_yclid';

export function getYclid(): string | null {
  try {
    return localStorage.getItem(YCLID_KEY);
  } catch {
    return null;
  }
}

export function setYclid(yclid: string): void {
  try {
    localStorage.setItem(YCLID_KEY, yclid);
  } catch {
    /* sandboxed iframe / private mode -- ignore */
  }
}

/** Capture yclid from the current URL (?yclid=...) and persist it. Numeric only. Call once on app/landing load. */
export function captureYclidFromUrl(): void {
  try {
    const v = new URLSearchParams(window.location.search).get('yclid');
    if (v && /^[0-9]{1,64}$/.test(v)) setYclid(v);
  } catch {
    /* ignore */
  }
}
