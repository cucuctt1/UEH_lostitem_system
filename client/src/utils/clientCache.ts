type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_PREFIX = "lf_cache:";
const memoryCache = new Map<string, CacheEnvelope<unknown>>();

function storageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

function safeReadStorage<T>(key: string): CacheEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function safeWriteStorage<T>(key: string, value: CacheEnvelope<T>): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Best-effort cache only.
  }
}

function removeStorageKey(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // Ignore storage removal failures.
  }
}

function isExpired(entry: CacheEnvelope<unknown>): boolean {
  return Date.now() >= entry.expiresAt;
}

export function getCachedValue<T>(key: string): T | null {
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    if (!isExpired(memoryEntry)) {
      return memoryEntry.value as T;
    }
    memoryCache.delete(key);
    removeStorageKey(key);
    return null;
  }

  const storageEntry = safeReadStorage<T>(key);
  if (!storageEntry) {
    return null;
  }

  if (isExpired(storageEntry)) {
    removeStorageKey(key);
    return null;
  }

  memoryCache.set(key, storageEntry);
  return storageEntry.value;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number): void {
  const safeTtl = Math.max(0, Math.floor(ttlMs));
  const envelope: CacheEnvelope<T> = {
    expiresAt: Date.now() + safeTtl,
    value
  };

  memoryCache.set(key, envelope as CacheEnvelope<unknown>);
  safeWriteStorage(key, envelope);
}

export function clearCachedValue(key: string): void {
  memoryCache.delete(key);
  removeStorageKey(key);
}

export function clearCachedPrefix(prefix: string): void {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  try {
    const fullPrefix = storageKey(prefix);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const currentKey = localStorage.key(index);
      if (currentKey && currentKey.startsWith(fullPrefix)) {
        localStorage.removeItem(currentKey);
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function clearAllCachedValues(): void {
  memoryCache.clear();

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const currentKey = localStorage.key(index);
      if (currentKey && currentKey.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(currentKey);
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function buildCacheKey(scope: string, params?: Record<string, unknown>): string {
  if (!params) {
    return `${scope}:default`;
  }

  const normalized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]);

  if (normalized.length === 0) {
    return `${scope}:default`;
  }

  return `${scope}:${JSON.stringify(Object.fromEntries(normalized))}`;
}
