import type { Header, HttpMethod, RequestPayload } from '../types';

const METHOD_SET = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS'
]);

export interface CurlParseResult {
  payload: RequestPayload | null;
  warnings: string[];
  error?: string;
}

function tokenizeCurl(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escapeNext = false;

  for (const char of input) {
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && quote !== "'") {
      escapeNext = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function normalizeMethod(value: string): HttpMethod | null {
  const upper = value.toUpperCase();
  return METHOD_SET.has(upper as HttpMethod) ? (upper as HttpMethod) : null;
}

function parseHeader(value: string): Header | null {
  const index = value.indexOf(':');
  if (index === -1) return null;
  const key = value.slice(0, index).trim();
  const headerValue = value.slice(index + 1).trim();
  if (!key) return null;
  return { key, value: headerValue, enabled: true };
}

export function parseCurlCommand(input: string): CurlParseResult {
  const warnings: string[] = [];
  const trimmed = input.trim();
  if (!trimmed) {
    return { payload: null, warnings, error: 'Paste a cURL command to import.' };
  }

  const tokens = tokenizeCurl(trimmed);
  if (tokens.length === 0) {
    return { payload: null, warnings, error: 'Paste a cURL command to import.' };
  }

  if (tokens[0] === 'curl') {
    tokens.shift();
  }

  let url: string | null = null;
  let method: HttpMethod | null = null;
  const headers: Header[] = [];
  const bodyParts: string[] = [];

  const readValue = (index: number, label: string) => {
    const next = tokens[index + 1];
    if (!next) {
      warnings.push(`Missing value for ${label}.`);
      return { value: null, skip: 0 };
    }
    return { value: next, skip: 1 };
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      const { value, skip } = readValue(i, 'method');
      if (value) {
        const normalized = normalizeMethod(value);
        if (!normalized) {
          return { payload: null, warnings, error: `Unsupported HTTP method: ${value}` };
        }
        method = normalized;
      }
      i += skip;
      continue;
    }

    if (token === '-H' || token === '--header') {
      const { value, skip } = readValue(i, 'header');
      if (value) {
        const header = parseHeader(value);
        if (!header) {
          warnings.push(`Invalid header format: ${value}`);
        } else {
          headers.push(header);
        }
      }
      i += skip;
      continue;
    }

    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-urlencode' ||
      token === '--data-ascii'
    ) {
      const { value, skip } = readValue(i, 'data');
      if (value) {
        bodyParts.push(value);
      }
      i += skip;
      continue;
    }

    if (token === '--url') {
      const { value, skip } = readValue(i, 'url');
      if (value) {
        url = value;
      }
      i += skip;
      continue;
    }

    if (token.startsWith('--url=')) {
      url = token.slice('--url='.length);
      continue;
    }

    if (token.startsWith('-H') && token.length > 2) {
      const header = parseHeader(token.slice(2));
      if (!header) {
        warnings.push(`Invalid header format: ${token.slice(2)}`);
      } else {
        headers.push(header);
      }
      continue;
    }

    if (token.startsWith('-X') && token.length > 2) {
      const normalized = normalizeMethod(token.slice(2));
      if (!normalized) {
        return { payload: null, warnings, error: `Unsupported HTTP method: ${token.slice(2)}` };
      }
      method = normalized;
      continue;
    }

    if (token === '-I' || token === '--head') {
      method = 'HEAD';
      continue;
    }

    if (token === '-G' || token === '--get') {
      method = 'GET';
      continue;
    }

    if (token.startsWith('http://') || token.startsWith('https://')) {
      url = token;
      continue;
    }

    if (token === '--compressed' || token === '-k' || token === '--insecure') {
      continue;
    }

    if (token.startsWith('-')) {
      warnings.push(`Ignored flag: ${token}`);
      continue;
    }
  }

  if (!url) {
    return { payload: null, warnings, error: 'No URL found in cURL command.' };
  }

  if (!method) {
    method = bodyParts.length > 0 ? 'POST' : 'GET';
  }

  let body: string | null = null;
  if (bodyParts.length > 0) {
    if (bodyParts.length > 1) {
      warnings.push('Multiple data segments detected; they were combined.');
    }
    body = bodyParts.join('&');
  }

  const payload: RequestPayload = {
    url,
    method,
    headers,
    body
  };

  return { payload, warnings };
}
