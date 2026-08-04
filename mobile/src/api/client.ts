/**
 * Base URL for the existing Express backend (br/backend). Override per-build
 * with EXPO_PUBLIC_API_URL, e.g. http://192.168.1.10:3000/api when pointing at
 * a locally running `npm run dev`.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL || 'https://br-api.geostat.ge/api';

const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * Query string for `params`. Array values are appended once per item, matching
 * how the backend reads repeated query keys (legalForm, size…); empty values are
 * left out entirely.
 */
export function buildQuery(params: QueryParams): string {
  const query = new URLSearchParams();
  const append = (key: string, value: QueryValue) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  };

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => append(key, v));
    else append(key, value);
  });

  return query.toString();
}

/** Absolute URL for an endpoint — for downloads, which bypass {@link apiGet}. */
export function apiUrl(path: string, params: QueryParams = {}): string {
  const qs = buildQuery(params);
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

/** GET a JSON endpoint. */
export async function apiGet<T = unknown>(
  path: string,
  params: QueryParams = {},
  { signal, timeout = DEFAULT_TIMEOUT }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(apiUrl(path, params), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** The backend returns either a bare array or `{ recordset: [...] }`. */
export function toArray<T = Record<string, unknown>>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const record = payload as { recordset?: unknown; data?: unknown };
    if (Array.isArray(record.recordset)) return record.recordset as T[];
    if (Array.isArray(record.data)) return record.data as T[];
  }
  return [];
}
