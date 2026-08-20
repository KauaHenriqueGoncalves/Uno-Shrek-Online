export default class LruCache {
  constructor({ max = 50, maxAge = 30000 } = {}) {
    this.max = max;
    this.maxAge = maxAge;
    this.map = new Map(); // key -> { value, expiresAt }
  }

  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }
    if (this._isExpired(entry)) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } 
    else if (this.map.size >= this.max) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
      log.debug({ evictedKey: oldestKey }, "[cache] remover item for LUR");
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.maxAge,
    });
  }
}
