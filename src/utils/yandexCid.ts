export function getYandexCid(): string | null {
  try {
    return localStorage.getItem('yandex_cid');
  } catch {
    return null;
  }
}
