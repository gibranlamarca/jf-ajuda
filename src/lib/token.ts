import crypto from 'crypto'

/** Generate a cryptographically random 64-char hex token */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** SHA-256 hash of a token — store this, never store the raw token */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Constant-time comparison to prevent timing attacks */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  try {
    const hash = hashToken(rawToken)
    const hashBuf = Buffer.from(hash, 'hex')
    const storedBuf = Buffer.from(storedHash, 'hex')
    if (hashBuf.length !== storedBuf.length) return false
    return crypto.timingSafeEqual(hashBuf, storedBuf)
  } catch {
    return false
  }
}
