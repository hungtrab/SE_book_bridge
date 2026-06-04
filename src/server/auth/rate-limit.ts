import { UnauthorizedError } from "../lib/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const buckets = new Map<string, Bucket>();

export function assertLoginAllowed(key: string, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    throw new UnauthorizedError("Too many login attempts. Try again later.");
  }
}

export function clearLoginAttempts(key: string): void {
  buckets.delete(key);
}
