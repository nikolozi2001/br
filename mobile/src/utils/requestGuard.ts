/**
 * Guards against a slow response overwriting a newer one.
 *
 * Searches are fired faster than they come back — a second query, a sort change,
 * a pull-to-refresh — and the responses do not arrive in the order they were
 * asked for. Without this, an earlier search finishing late would replace the
 * results of the one the user is actually looking at.
 *
 * Each request takes a token at the start and checks it before touching state:
 *
 *     const token = guard.start();
 *     const rows = await fetchRows();
 *     if (!guard.isCurrent(token)) return;   // a newer search has overtaken us
 */
export interface RequestGuard {
  /** Marks a new request as the current one and returns its token. */
  start(): number;
  /** True only while `token` belongs to the most recent request. */
  isCurrent(token: number): boolean;
}

export function createRequestGuard(): RequestGuard {
  let latest = 0;
  return {
    start: () => ++latest,
    isCurrent: (token) => token === latest,
  };
}
