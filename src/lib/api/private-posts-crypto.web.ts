import {
  base64url,
  exportJWK,
  generateKeyPair,
  type JWK,
  type KeyLike,
  SignJWT,
} from 'jose'
import {sha256} from 'js-sha256'

export type DpopKey = {
  privateJwk: JWK
  publicJwk: JWK
  privateKey: KeyLike
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
