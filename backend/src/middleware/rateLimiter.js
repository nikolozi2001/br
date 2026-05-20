/**
 * In-memory sliding-window rate limiter.
 * Tracks request timestamps per IP and rejects when the count within
 * the rolling window exceeds the configured limit.
 *
 * Config (all optional, defaults shown):
 *   windowMs   – window length in ms          (default: 60 000  = 1 minute)
 *   max        – max requests per window       (default: 50)
 *   message    – body sent on 429              (default: Georgian text)
 *   skip       – function(req) => bool         (default: skip nothing)
 */

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX = 50;

// ip  →  [ ...timestamps (ms) ]
const store = new Map();

// Periodically purge stale entries so the Map doesn't grow forever.
// We only keep IPs that had at least one request in the last windowMs.
setInterval(() => {
  const cutoff = Date.now() - DEFAULT_WINDOW_MS * 2;
  for (const [ip, timestamps] of store) {
    const recent = timestamps.filter(t => t > cutoff);
    if (recent.length === 0) {
      store.delete(ip);
    } else {
      store.set(ip, recent);
    }
  }
}, 60 * 1000).unref(); // .unref() so this timer doesn't keep the process alive

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX;
  const message =
    options.message ??
    'მოთხოვნების ლიმიტი ამოიწურა. სცადეთ ერთი წუთის შემდეგ.';
  const skip = options.skip ?? (() => false);

  return function rateLimiter(req, res, next) {
    if (skip(req)) return next();

    // Prefer X-Forwarded-For (set by IIS ARR / reverse proxy) over socket IP
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get / create the timestamp list for this IP
    let timestamps = store.get(ip) || [];

    // Drop timestamps outside the current window
    timestamps = timestamps.filter(t => t > windowStart);

    const remaining = Math.max(0, max - timestamps.length);
    // Reset time = when the oldest request in the window will fall out
    const resetAt =
      timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

    // Always send rate-limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000)); // Unix epoch seconds

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil((resetAt - now) / 1000));
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((resetAt - now) / 1000),
      });
    }

    // Record this request
    timestamps.push(now);
    store.set(ip, timestamps);

    next();
  };
}

module.exports = { createRateLimiter };
