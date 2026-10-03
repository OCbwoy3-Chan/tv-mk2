import {requireNativeModule} from 'expo-modules-core'
import {base64url} from 'multiformats/bases/base64'

type PrivateJwk = {
  kty: 'EC'
  crv: 'P-256'
  kid: string
  x: string
  y: string
  d: string
  alg: 'ES256'
}

type NativeCryptoModule = {
  digest(data: Uint8Array, algorithm: 'sha256'): Promise<Uint8Array>
  getRandomValues(byteLength: number): Promise<Uint8Array>
  generatePrivateJwk(algorithm: 'ES256'): Promise<PrivateJwk>
  createJwt(header: string, payload: string, jwk: PrivateJwk): Promise<string>
}

/**
 * Reuse oauth-client-expo's registered module because its package exports do
 * not expose the native crypto helper. Keep this surface aligned with 0.1.12.
 */
const NativeCrypto = requireNativeModule<NativeCryptoModule>(
  'ExpoAtprotoOAuthClient',
)

export type DpopKey = {
  privateJwk: PrivateJwk
  publicJwk: Omit<PrivateJwk, 'd'>
}

export function encodeBase64url(data: Uint8Array) {
  return base64url.baseEncode(data)
}

export async function generateDpopKey(): Promise<DpopKey> {
  const privateJwk = await NativeCrypto.generatePrivateJwk('ES256')
  const {d: _privatePart, ...publicJwk} = privateJwk
  return {privateJwk, publicJwk}
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
    jti: encodeBase64url(await NativeCrypto.getRandomValues(16)),
  }
  if (includeAth) {
    claims.ath = encodeBase64url(
      await NativeCrypto.digest(new TextEncoder().encode(accessToken), 'sha256'),
    )
  }
  return NativeCrypto.createJwt(
    JSON.stringify({typ: 'dpop+jwt', alg: 'ES256', jwk: key.publicJwk}),
    JSON.stringify(claims),
    key.privateJwk,
  )
}
