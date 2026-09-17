/**
 * Crypto helpers untuk auth (WebCrypto, no deps):
 *  - verifyGoogleIdToken: verifikasi ID token Google (RS256 via JWKS)
 *  - signSession / verifySession: session JWT kami sendiri (HS256)
 */

const enc = new TextEncoder()
const dec = new TextDecoder()

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 hari

export function b64urlDecode(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function b64urlEncode(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeJson(part) {
  return JSON.parse(dec.decode(b64urlDecode(part)))
}

// JWKS di-cache per max-age header (rotasi key Google butuh refresh berkala).
let jwksCache = null

async function fetchJwks(force = false) {
  if (!force && jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys
  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error('JWKS fetch failed')
  const data = await res.json()
  const m = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '')
  const ttl = m ? Number(m[1]) : 3600
  jwksCache = { keys: data.keys, expiresAt: Date.now() + Math.max(60, ttl - 60) * 1000 }
  return data.keys
}

/**
 * Verifikasi ID token Google. Melempar Error bila tidak valid.
 * Mengecek signature (RS256), audience, issuer, dan expiry.
 */
export async function verifyGoogleIdToken(idToken, clientId) {
  if (!idToken || !clientId) throw new Error('missing token or client id')
  const parts = String(idToken).split('.')
  if (parts.length !== 3) throw new Error('malformed token')
  const [h, p, s] = parts
  const header = decodeJson(h)
  const payload = decodeJson(p)
  const signature = b64urlDecode(s)
  const data = enc.encode(`${h}.${p}`)

  if (payload.aud !== clientId) throw new Error('aud mismatch')
  if (!GOOGLE_ISSUERS.includes(payload.iss)) throw new Error('iss mismatch')
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) throw new Error('token expired')

  let keys = await fetchJwks()
  let jwk = keys.find((k) => k.kid === header.kid)
  if (!jwk) {
    // kid tidak ada di cache — paksa refresh (rotasi key)
    keys = await fetchJwks(true)
    jwk = keys.find((k) => k.kid === header.kid)
  }
  if (!jwk) throw new Error('signing key not found')

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
  if (!ok) throw new Error('bad signature')

  return {
    google_sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
  }
}

async function hmacKey(secret) {
  if (!secret) throw new Error('SESSION_SECRET not configured')
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** Terbitkan session JWT untuk userId. */
export async function signSession(uid, secret) {
  const key = await hmacKey(secret)
  const now = Math.floor(Date.now() / 1000)
  const payload = { uid, iat: now, exp: now + SESSION_TTL_SECONDS }
  const body = `${b64urlEncode(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))}.${b64urlEncode(
    enc.encode(JSON.stringify(payload)),
  )}`
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)))
  return { token: `${body}.${b64urlEncode(sig)}`, exp: payload.exp }
}

/** Verifikasi session JWT. Mengembalikan payload, atau null bila invalid/expired. */
export async function verifySession(token, secret) {
  if (!token || !secret) return null
  const parts = String(token).split('.')
  if (parts.length !== 3) return null
  const [h, p, s] = parts
  let payload
  try {
    payload = decodeJson(p)
  } catch {
    return null
  }
  if (typeof payload.uid !== 'string') return null
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null

  let key
  try {
    key = await hmacKey(secret)
  } catch {
    return null
  }
  const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(s), enc.encode(`${h}.${p}`))
  return ok ? payload : null
}
