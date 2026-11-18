// The same password rule applies at sign-up, after a reset link and when changing it in Settings.
export const MIN_PASSWORD = 6;

/** Returns a message describing why a new password can't be used, or null when it can. */
export function newPasswordProblem(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirmation) return "The passwords don't match.";
  return null;
}
