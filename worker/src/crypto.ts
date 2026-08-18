/**
 * Synapse Systems - Encryption utilities
 * AES-256-GCM encryption for PII fields at rest
 */

const ALGO = { name: 'AES-GCM', length: 256 } as const

export async function getKey(secret: string, usage: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret))
  return crypto.subtle.importKey('raw', hash, ALGO, false, usage)
}

/**
 * تشفير نص مع AES-256-GCM
 * الناتج: base64(iv || ciphertext || tag)
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )
  const result = new Uint8Array(iv.length + cipher.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(cipher), iv.length)
  return btoa(String.fromCharCode(...result))
}

/**
 * فك التشفير
 */
export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  try {
    const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const cipher = data.slice(12)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch {
    return '' // فشل فك التشفير - أعد فارغ
  }
}

/**
 * Hash password (يستخدم bcrypt في الواقع، هذه بديلة للاختبارات)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const combined = `${salt}:${password}`
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(combined))
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

/**
 * توليد File ID آمن
 */
export function generateFileId(): string {
  return crypto.randomUUID()
}
