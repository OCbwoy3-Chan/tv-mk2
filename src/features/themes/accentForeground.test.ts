import {accentForeground} from './accentForeground'
import {DEFAULT_ACTIVE_THEME} from './catalog'
import {activeThemeToScheme} from './semanticTheme'

const theme = activeThemeToScheme(DEFAULT_ACTIVE_THEME)!.light

it('carries the authored on-accent role into the runtime theme', () => {
  expect(theme.onAccent).toBe(
    DEFAULT_ACTIVE_THEME.light.record.base.colors.onAccent,
  )
  expect(theme.palette.white).toBe('#ffffff')
})

it('preserves a readable authored foreground', () => {
  expect(accentForeground({...theme, onAccent: '#172400'}, '#c4ff00')).toBe(
    '#172400',
  )
})

it('honors explicit white even on a bright accent', () => {
  expect(accentForeground({...theme, onAccent: '#ffffff'}, '#c4ff00')).toBe(
    '#ffffff',
  )
})

it('preserves the authored foreground across interaction backgrounds', () => {
  const authored = {...theme, onAccent: '#111111'}
  expect(accentForeground(authored, '#f5f500')).toBe('#111111')
  expect(accentForeground(authored, '#202000')).toBe('#111111')
})

it('supports legacy themes without an authored foreground', () => {
  expect(accentForeground({...theme, onAccent: undefined}, '#ffff00')).toBe(
    '#000000',
  )
})

it('preserves the light Witchsky Dark foreground on its coral accent', () => {
  expect(accentForeground({...theme, onAccent: '#fefbfb'}, '#ed5345')).toBe(
    '#fefbfb',
  )
})
