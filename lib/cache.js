const cache = new Map();

const defaults = {
  ttl: 30000,
  maxSize: 500,
};

function get(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttl) {
  if (cache.size >= defaults.maxSize) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, {
    value,
    expiry: Date.now() + (ttl || defaults.ttl),
  });
}

function del(key) {
  cache.delete(key);
}

function flush() {
  cache.clear();
}

function wrap(key, fetchFn, ttl) {
  const cached = get(key);
  if (cached !== undefined) return cached;
  const value = fetchFn();
  set(key, value, ttl);
  return value;
}

module.exports = { get, set, del, flush, wrap };
