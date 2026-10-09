/** @jest-environment jsdom */

import {act, createRef} from 'react'
import {type TextInput} from 'react-native'
import {createRoot} from 'react-dom/client'

import {HandleAutocompleteInput} from './index.web'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: ({message}: {message: string}) => message}),
}))
jest.mock('react-native', () => jest.requireActual('react-native-web'))
jest.mock('#/state/preferences/enable-square-buttons', () => ({
  useEnableSquareButtons: () => false,
}))
jest.mock('#/env', () => ({IS_WEB: true, IS_NATIVE: false}))
jest.mock('#/lib/constants', () => ({HITSLOP_20: {}}))
jest.mock('#/alf', () => ({
  atoms: {text_md: {fontSize: 16}, p_xs: {padding: 4}},
  useTheme: () => ({scheme: 'light', atoms: {}, palette: {}}),
  useAlf: () => ({fonts: {family: 'system', scaleMultiplier: 1}}),
  flatten:
    jest.requireActual<typeof import('react-native')>('react-native-web')
      .StyleSheet.flatten,
  applyFonts: () => {},
  utils: {alpha: () => undefined},
  tokens: {},
  native: () => ({}),
  web: (style: unknown) => style,
  platform: () => ({}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native-web')
    .Text,
}))
jest.mock('#/components/icons/At', () => ({
  At_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Autocomplete/types', () => ({
  profileIdentifier: (profile: {handle: string}) => profile.handle,
}))
jest.mock('#/components/Autocomplete', () => ({
  useAutocomplete: () => ({items: []}),
  Autocomplete: () => null,
}))

const mockInputAttachments = jest.fn()
jest.mock('@bsky.app/sift', () => {
  const {useCallback, useState} =
    jest.requireActual<typeof import('react')>('react')
  return {
    useSift() {
      const [input, setInput] = useState<HTMLElement | null>(null)
      const ref = useCallback((node: HTMLElement | null) => {
        mockInputAttachments(node)
        setInput(node)
      }, [])
      return {
        refs: {},
        elements: {input},
        targetProps: {ref, role: 'combobox'},
        updatePosition: () => {},
      }
    },
  }
})

it('keeps the login input attached while typing and updating parent props', () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const inputRef = createRef<React.ComponentRef<typeof TextInput>>()
  const onValueChange = jest.fn()
  mockInputAttachments.mockClear()
  jest.useFakeTimers()

  try {
    act(() =>
      root.render(
        <HandleAutocompleteInput
          label="Account handle"
          inputRef={inputRef}
          onValueChange={onValueChange}
        />,
      ),
    )
    const input = container.querySelector('input')!
    expect(inputRef.current).toBe(input)
    expect(mockInputAttachments.mock.calls).toEqual([[input]])

    act(() => input.focus())
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!
    for (const value of ['a', 'alice', 'alice.bsky.social', '']) {
      act(() => {
        setValue.call(input, value)
        input.dispatchEvent(new Event('input', {bubbles: true}))
      })
      expect(onValueChange).toHaveBeenLastCalledWith(value)
      expect(input.value).toBe(value)
    }
    act(() =>
      root.render(
        <HandleAutocompleteInput
          label="Account handle"
          inputRef={inputRef}
          onValueChange={onValueChange}
          isInvalid
        />,
      ),
    )
    act(() => input.blur())
    act(() => jest.runOnlyPendingTimers())
    expect(inputRef.current).toBe(input)
    expect(mockInputAttachments.mock.calls).toEqual([[input]])

    act(() => root.unmount())
    expect(inputRef.current).toBeNull()
    expect(mockInputAttachments.mock.calls).toEqual([[input], [null]])
  } finally {
    act(() => root.unmount())
    jest.useRealTimers()
    container.remove()
  }
})
