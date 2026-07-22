/**
 * Base URL for the existing Express backend (br/backend). Override per-build
 * with EXPO_PUBLIC_API_URL, e.g. http://192.168.1.10:3000/api when pointing at
 * a locally running `npm run dev`.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://br-api.geostat.ge/api';

const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * GET a JSON endpoint. `params` values that are arrays are appended once per
 * item, matching how the backend reads repeated query keys (legalForm, size…).
 */
export async function apiGet(path, params = {}, { signal, timeout = DEFAULT_TIMEOUT } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== '') query.append(key, String(v));
      });
    } else {
      query.append(key, String(value));
    }
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const qs = query.toString();
  try {
    const response = await fetch(`${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** The backend returns either a bare array or `{ recordset: [...] }`. */
export function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.recordset)) return payload.recordset;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
