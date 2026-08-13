import {type ViewStyle} from 'react-native'

import {IS_WEB} from '#/env'

export type UserStyleClassName = `wsky-${string}`

type ClassName = UserStyleClassName | false | null | undefined

const cache = new Map<string, ViewStyle>()

/**
 * Adds stable, semantic CSS classes to React Native Web elements without
 * shipping a CSS-interop runtime. The object shape is StyleQ's compiled-style
 * format, which RNW merges with its own generated classes.
 *
 * Native platforms receive no style at all.
 */
export function userStyle(...classNames: ClassName[]): ViewStyle | undefined {
  if (!IS_WEB) return undefined

  const names = classNames.filter(
    (className): className is UserStyleClassName => Boolean(className),
  )
  const key = names.join(' ')

  const cached = cache.get(key)
  if (cached) return cached

  const style: Record<string, string | boolean> = {$$css: true}
  for (const name of names) {
    style[name] = name
  }

  const compiledStyle = style as unknown as ViewStyle
  cache.set(key, compiledStyle)
  return compiledStyle
}
