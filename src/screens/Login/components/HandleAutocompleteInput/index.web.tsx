import {useRef, useState} from 'react'
import {View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {useLingui} from '@lingui/react/macro'

import {mergeRefs} from '#/lib/merge-refs'
import {profileIdentifier} from '#/lib/strings/handles'
import {atoms as a, native} from '#/alf'
import {
  Autocomplete,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {type HandleAutocompleteInputProps} from './shared'

/**
 * Web: typed results float in a Sift dropdown anchored to the input (matching
 * the search bar). See index.native.tsx for the native overlay variant.
 */
export function HandleAutocompleteInput({
  initialValue = '',
  onValueChange,
  onSubmit,
  onSubmitEditing,
  submitOnSelect = true,
  editable = true,
  autoFocus,
  testID = 'loginUsernameInput',
  label,
  placeholder,
  accessibilityHint,
  icon: Icon = At,
  isInvalid,
  returnKeyType = 'done',
  inputRef,
  showAutocomplete = true,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}: HandleAutocompleteInputProps) {
  const {t: l} = useLingui()
  const [text, setText] = useState(initialValue)
  const [active, setActive] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sift = useSift({
    offset: a.p_xs.padding,
    placement: 'bottom-start',
    dynamicWidth: true,
  })

  const trimmed = text.trim()
  const showResults = showAutocomplete && active && trimmed.length > 0

  const {items} = useAutocomplete({
    type: 'profile',
    query: showResults ? text : '',
    limit: 8,
  })

  const onChangeText = (value: string) => {
    setText(value)
    onValueChange(value)
    /*
     * Only open after the user types - focusing a prefilled handle (e.g. from
     * account switch) should not immediately expand suggestions.
     */
    setActive(value.trim().length > 0)
  }

  const onSelect = (item: AutocompleteItem) => {
    if (item.type !== 'profile') return

    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }

    const identifier = profileIdentifier(item.profile)
    setText(identifier)
    onValueChange(identifier)
    setActive(false)
    sift.elements.input?.blur()
    if (submitOnSelect) {
      onSubmit?.()
    } else {
      onSubmitEditing?.()
    }
  }

  const onFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    onFocusProp?.()
  }

  const onBlur = () => {
    onBlurProp?.()
    blurTimeoutRef.current = setTimeout(() => {
      setActive(false)
      blurTimeoutRef.current = null
    }, 150)
  }

  const {ref: siftInputRef, ...siftA11yProps} = sift.targetProps

  return (
    <View
      collapsable={false}
      ref={sift.refs.setAnchor}
      style={[a.relative, a.z_20, native({overflow: 'visible'})]}
      onLayout={() => void sift.updatePosition()}>
      <TextField.Root isInvalid={isInvalid}>
        <TextField.Icon icon={Icon} />
        <TextField.Input
          testID={testID}
          label={label}
          placeholder={placeholder}
          inputRef={mergeRefs([siftInputRef, inputRef])}
          {...siftA11yProps}
          autoCapitalize="none"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoComplete="username"
          returnKeyType={returnKeyType}
          textContentType="username"
          value={text}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={() => {
            setActive(false)
            if (onSubmitEditing) {
              onSubmitEditing()
            } else {
              onSubmit?.()
            }
          }}
          blurOnSubmit={false}
          editable={editable}
          accessibilityHint={
            accessibilityHint ?? l`Enter your handle (e.g. alice.bsky.social)`
          }
        />
      </TextField.Root>
      {showResults && items.length > 0 ? (
        <Autocomplete
          sift={sift}
          data={items}
          onSelect={onSelect}
          onDismiss={() => setActive(false)}
        />
      ) : null}
    </View>
  )
}
