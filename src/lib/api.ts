export async function safeParseJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (res.ok && !trimmed) {
    return {} as T;
  }

  const looksLikeJson =
    contentType.includes('application/json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (looksLikeJson && trimmed) {
    let parsed: (T & { error?: string }) | null = null;
    try {
      parsed = JSON.parse(trimmed) as T & { error?: string };
    } catch {
      parsed = null;
    }

    if (parsed !== null) {
      if (!res.ok) {
        throw new Error(parsed.error || `Request failed (${res.status}).`);
      }
      return parsed;
    }
  }

  if (
    res.url.includes('__cookie_check') ||
    trimmed.includes('__cookie_check')
  ) {
    throw new Error(
      'Preview session needs re-verification. Please refresh the page once and try again.'
    );
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        'Server is starting up or temporarily busy. Please try again in a few seconds.'
      );
    }
    throw new Error(
      `Server returned HTTP ${res.status}. Please try again.`
    );
  }

  if (contentType.includes('text/html') || trimmed.startsWith('<')) {
    throw new Error(
      'Received a web page instead of store data (preview session may have reset). Please reload the page and try again.'
    );
  }

  throw new Error('Could not read server response. Please reload and try again.');
}
