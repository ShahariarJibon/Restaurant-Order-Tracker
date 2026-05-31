const PREFIX = 'cache_';

export function cacheData(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

export function getCachedData(key, maxAge = 86400000) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAge) return null;
    return data;
  } catch {
    return null;
  }
}
