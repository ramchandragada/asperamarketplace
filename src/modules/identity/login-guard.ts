export const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_LOCK_THRESHOLD = 8;

export function isLoginLocked(recentFailureCount: number): boolean {
  return recentFailureCount >= LOGIN_LOCK_THRESHOLD;
}
