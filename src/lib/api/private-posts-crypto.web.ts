import {
  base64url,
  calculateJwkThumbprint,
  CompactEncrypt,
  exportJWK,
  generateKeyPair,
  importJWK,
  type JWK,
  SignJWT,
} from 'jose'
import {sha256} from 'js-sha256'

export async function encryptPrivatePost(jwk: JWK, author: string, rkey: string, content: string) {
  if (await calculateJwkThumbprint(jwk) !== jwk.kid) throw new Error('Invalid private posts encryption key')
  return new CompactEncrypt(new TextEncoder().encode(content))
    .setProtectedHeader({alg: 'RSA-OAEP-256', enc: 'A256GCM', kid: jwk.kid, author, rkey})
    .encrypt(await importJWK(jwk, 'RSA-OAEP-256'))
}

export type DpopKey = {
  privateJwk: JWK
  publicJwk: JWK
  privateKey: CryptoKey
}

export function encodeBase64url(data: Uint8Array) {
  return base64url.encode(data)
}

export async function generateDpopKey(): Promise<DpopKey> {
  const {privateKey, publicKey} = await generateKeyPair('ES256', {
    extractable: true,
  })
  return {
    privateKey,
    privateJwk: await exportJWK(privateKey),
    publicJwk: await exportJWK(publicKey),
  }
}

export async function createSpaceDpopProof({
  method,
  url,
  accessToken,
  key,
  includeAth = true,
}: {
  method: string
  url: URL
  accessToken: string
  key: DpopKey
  includeAth?: boolean
}) {
  const claims: Record<string, unknown> = {
    htm: method,
    htu: url.toString(),
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  }
  if (includeAth) {
    claims.ath = base64url.encode(new Uint8Array(sha256.arrayBuffer(accessToken)))
  }
  return new SignJWT(claims)
    .setProtectedHeader({typ: 'dpop+jwt', alg: 'ES256', jwk: key.publicJwk})
    .sign(key.privateKey)
}
