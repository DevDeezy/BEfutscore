// Lightweight timing and cache helpers for Netlify functions

const DEFAULT_SMAXAGE = parseInt(process.env.API_SMAXAGE || '60', 10);
const DEFAULT_STALE = parseInt(process.env.API_STALE || '30', 10);

function startTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}

// Simple in-memory cache (per function instance). Serverless cold starts clear it.
const memoryCache = new Map();

function cacheGet(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function cacheSet(key, value, ttlMs) {
  memoryCache.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
}

function withCacheControl(headers = {}, sMaxAge = DEFAULT_SMAXAGE, staleWhileRevalidate = DEFAULT_STALE, revalidateToken) {
  const extras = revalidateToken ? { 'x-cache-buster': String(revalidateToken) } : {};
  return { ...headers, 'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`, ...extras };
}

module.exports = {
  startTimer,
  cacheGet,
  cacheSet,
  withCacheControl,
};


