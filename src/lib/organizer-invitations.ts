// An invitation is expired once `now` reaches or passes its expiresAt — the
// boundary counts as expired so a lazily-checked row never lingers "pending"
// for longer than its stated lifetime.
export function hasExpired(expiresAt: Date | string, now: Date = new Date()): boolean {
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return now.getTime() >= expiry.getTime();
}
