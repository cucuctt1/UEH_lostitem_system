const TOKEN_KEY = "lf_token";
const USER_KEY = "lf_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(value: T): void {
  localStorage.setItem(USER_KEY, JSON.stringify(value));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}
