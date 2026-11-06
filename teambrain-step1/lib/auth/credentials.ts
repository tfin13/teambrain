import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
// bcrypt ignores everything past 72 bytes, so reject longer passwords instead of silently truncating.
const MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Returns an error message, or null if the credentials are acceptable for a new account. */
export function validateNewCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES)
    return "Password is too long.";
  return null;
}
