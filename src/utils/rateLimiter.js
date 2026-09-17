const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5; // max complaints per user per hour
const COOLDOWN_MS = 20 * 1000; // min gap between two submissions

const history = new Map(); // chatId -> array of submission timestamps (ms)

/**
 * In-memory per-chat rate limit for complaint submissions, to keep a single
 * spammy user from flooding Groq calls and the CEO's chat. Not shared
 * across process restarts/instances, which is fine for anti-abuse purposes
 * (not a security boundary).
 */
function checkLimit(chatId) {
  const now = Date.now();
  const timestamps = (history.get(chatId) || []).filter((ts) => now - ts < WINDOW_MS);

  if (timestamps.length > 0) {
    const lastTs = timestamps[timestamps.length - 1];
    if (now - lastTs < COOLDOWN_MS) {
      return { allowed: false, retryAfterMs: COOLDOWN_MS - (now - lastTs) };
    }
  }

  if (timestamps.length >= MAX_PER_WINDOW) {
    const oldestTs = timestamps[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldestTs) };
  }

  timestamps.push(now);
  history.set(chatId, timestamps);
  return { allowed: true };
}

module.exports = { checkLimit };
