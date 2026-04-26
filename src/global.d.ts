// TS6.0 enables noUncheckedSideEffectImports
declare module '*.css'

declare module 'psl' {
  export type ParsedDomain = {
    input: string
    tld: string | null
    sld: string | null
    domain: string | null
    subdomain: string | null
    listed: boolean
    error?: Error
  }

  const psl: {
    parse(domain: string): ParsedDomain
  }

  export default psl
}
