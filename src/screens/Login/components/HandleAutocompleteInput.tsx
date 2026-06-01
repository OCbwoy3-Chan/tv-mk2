import {useRef, useState} from 'react'
import {Pressable, type TextInput, View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {useLingui} from '@lingui/react/macro'

import {profileIdentifier} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, native, useTheme} from '#/alf'
import {
  Autocomplete,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import * as ProfileCard from '#/components/ProfileCard'
import {IS_NATIVE} from '#/env'

export function HandleAutocompleteInput({
  initialValue = '',
  onValueChange,
  onSubmit,
  editable = true,
  autoFocus,
  testID = 'loginUsernameInput',
  label,
  accessibilityHint,
}: {
  initialValue?: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  editable?: boolean
  autoFocus?: boolean
  testID?: string
  label: string
  accessibilityHint?: string
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const [text, setText] = useState(initialValue)
  const [active, setActive] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<TextInput>(null)

  const sift = useSift({
    offset: a.p_xs.padding,
    placement: 'bottom-start',
    dynamicWidth: true,
  })

  const trimmed = text.trim()
  const showResults = active && trimmed.length > 0

  const {items} = useAutocomplete({
    type: 'profile',
    query: showResults ? text : '',
    limit: 8,
  })

  const onChangeText = (value: string) => {
    setText(value)
    onValueChange(value)
    if (!active && value.trim()) {
      setActive(true)
    }
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
    if (IS_NATIVE) {
      inputRef.current?.blur()
    } else {
      sift.elements.input?.blur()
    }
    onSubmit()
  }

  const onFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (trimmed.length > 0) {
      setActive(true)
    }
  }

  const onBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setActive(false)
      blurTimeoutRef.current = null
    }, 150)
  }

  const {ref: siftInputRef, ...siftA11yProps} = sift.targetProps

  return (
    <View
      collapsable={false}
      ref={IS_NATIVE ? undefined : sift.refs.setAnchor}
      style={[a.relative, a.z_20, native({overflow: 'visible'})]}>
      <TextField.Root>
        <TextField.Icon icon={At} />
        <TextField.Input
          testID={testID}
          label={label}
          inputRef={IS_NATIVE ? inputRef : siftInputRef}
          {...(IS_NATIVE ? {} : siftA11yProps)}
          autoCapitalize="none"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoComplete="username"
          returnKeyType="done"
          textContentType="username"
          value={text}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
          editable={editable}
          accessibilityHint={
            accessibilityHint ?? l`Enter your handle (e.g. alice.bsky.social)`
          }
        />
      </TextField.Root>
      {showResults && items.length > 0 && IS_NATIVE && moderationOpts ? (
        <View
          style={[
            a.mt_xs,
            a.overflow_hidden,
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg,
          ]}>
          {items.map((item, index) => {
            if (item.type !== 'profile') return null
            const isLast = index === items.length - 1
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => onSelect(item)}
                style={({pressed}) => [
                  a.py_sm,
                  a.px_md,
                  pressed && t.atoms.bg_contrast_25,
                  !isLast && [a.border_b, t.atoms.border_contrast_low],
                ]}>
                <ProfileCard.Header>
                  <ProfileCard.Avatar
                    disabledPreview
                    profile={item.profile}
                    moderationOpts={moderationOpts}
                  />
                  <ProfileCard.NameAndHandle
                    profile={item.profile}
                    moderationOpts={moderationOpts}
                  />
                </ProfileCard.Header>
              </Pressable>
            )
          })}
        </View>
      ) : showResults && items.length > 0 && !IS_NATIVE ? (
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
