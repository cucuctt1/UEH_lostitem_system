const TAG_BODY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

export function normalizeTagToken(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const withoutHash = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (!TAG_BODY_PATTERN.test(withoutHash)) {
    return null;
  }

  return withoutHash;
}

export function parseTagsInput(input: unknown): string[] {
  let rawTokens: string[] = [];

  if (Array.isArray(input)) {
    rawTokens = input.map((item) => String(item));
  } else if (typeof input === "string") {
    const text = input.trim();
    if (!text) {
      return [];
    }

    if (text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          rawTokens = parsed.map((item) => String(item));
        }
      } catch {
        rawTokens = text.split(/[\s,]+/g);
      }
    } else {
      rawTokens = text.split(/[\s,]+/g);
    }
  } else if (input != null) {
    rawTokens = [String(input)];
  }

  const normalized = rawTokens
    .map((token) => normalizeTagToken(token))
    .filter((token): token is string => Boolean(token));

  return Array.from(new Set(normalized)).slice(0, 10);
}

export function normalizeTagFilter(tag: string | undefined): string | undefined {
  if (!tag) {
    return undefined;
  }

  return normalizeTagToken(tag) ?? undefined;
}
