/** @jest-environment jsdom */

import {act, createRef} from 'react'
import {type TextInput} from 'react-native'
import {createRoot} from 'react-dom/client'

import {SearchAutocompleteInput} from './index'

/* The iOS Jest preset otherwise resolves the native autocomplete variant. */
jest.mock('./index', () => jest.requireActual('./index.tsx'))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: ({message}: {message: string}) => message}),
}))
jest.mock('react-native', () => jest.requireActual('react-native-web'))
jest.mock('#/env', () => ({IS_WEB: true, IS_NATIVE: false}))
jest.mock('#/lib/constants', () => ({HITSLOP_10: {}, HITSLOP_20: {}}))
jest.mock('#/state/events', () => ({listenFocusSearch: () => () => {}}))
jest.mock('#/state/preferences/enable-square-buttons', () => ({
  useEnableSquareButtons: () => false,
}))
jest.mock('#/alf', () => ({
  atoms: {text_md: {fontSize: 16}, p_sm: {padding: 8}},
  useTheme: () => ({scheme: 'light', atoms: {}, palette: {}}),
  useAlf: () => ({fonts: {family: 'system', scaleMultiplier: 1}}),
  flatten: jest.requireActual<typeof import('react-native')>('react-native-web')
    .StyleSheet.flatten,
  applyFonts: () => {},
  utils: {alpha: () => undefined},
  tokens: {borderRadius: {}},
  web: (style: unknown) => style,
  platform: () => ({}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native-web')
    .Text,
}))
jest.mock('#/components/Button', () => ({
  Button: () => null,
  ButtonIcon: () => null,
}))
jest.mock('#/components/icons/MagnifyingGlass', () => ({
  MagnifyingGlass_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Times', () => ({
  TimesLarge_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Autocomplete', () => ({
  useAutocomplete: () => ({items: []}),
  Autocomplete: () => null,
}))

const mockInputAttachments = jest.fn()
jest.mock('@bsky.app/sift', () => {
  const {useCallback, useState} = jest.requireActual<typeof import('react')>(
    'react',
  )
  return {
    useSift() {
      const [, setInput] = useState<HTMLElement | null>(null)
      const ref = useCallback((node: HTMLElement | null) => {
        mockInputAttachments(node)
        setInput(node)
      }, [])
      return {
        refs: {},
        targetProps: {ref, role: 'combobox'},
        updatePosition: () => {},
      }
    },
  }
})

it('keeps the Sift input attached through focus and query updates', () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const ref = createRef<React.ComponentRef<typeof TextInput>>()
  mockInputAttachments.mockClear()
  try {
    act(() => root.render(<SearchAutocompleteInput ref={ref} value="" />))
    const input = container.querySelector('input')!
    expect(ref.current).toBe(input)
    expect(mockInputAttachments.mock.calls).toEqual([[input]])

    act(() => input.focus())
    act(() =>
      root.render(<SearchAutocompleteInput ref={ref} value="witchsky" />),
    )
    act(() => input.blur())
    expect(ref.current).toBe(input)
    expect(mockInputAttachments.mock.calls).toEqual([[input]])

    act(() => root.unmount())
    expect(ref.current).toBeNull()
    expect(mockInputAttachments.mock.calls).toEqual([[input], [null]])
  } finally {
    act(() => root.unmount())
    container.remove()
  }
})
