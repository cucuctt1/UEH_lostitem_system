import { apiClient } from "../services/api/client";

const LOCAL_HOSTNAME_PATTERN = /^(localhost|127\.0\.0\.1)$/i;

function toApiBaseUrl(value: string): string | null {
  const base = apiClient.defaults.baseURL;
  if (typeof base !== "string" || !base) {
    return null;
  }

  try {
    return new URL(value, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return null;
  }
}

export function resolveMediaUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const input = value.trim();
  if (!input) {
    return null;
  }

  if (input.startsWith("/")) {
    return toApiBaseUrl(input) ?? input;
  }

  try {
    const parsed = new URL(input);
    const pageHost = window.location.hostname;

    if (
      LOCAL_HOSTNAME_PATTERN.test(parsed.hostname) &&
      !LOCAL_HOSTNAME_PATTERN.test(pageHost)
    ) {
      const normalizedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return toApiBaseUrl(normalizedPath) ?? input;
    }

    return parsed.toString();
  } catch {
    return toApiBaseUrl(input) ?? input;
  }
}
