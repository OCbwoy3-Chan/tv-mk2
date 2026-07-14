import {useRef, useState} from 'react'
import {type TextInput, TouchableOpacity, View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {useLingui} from '@lingui/react/macro'

import {mergeRefs} from '#/lib/merge-refs'
import {profileIdentifier} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, native, useTheme} from '#/alf'
import {type AutocompleteItem, useAutocomplete} from '#/components/Autocomplete'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import * as ProfileCard from '#/components/ProfileCard'
import {type HandleAutocompleteInputProps} from './shared'

/*
 * Keep the overlay short enough to sit between the auth header and the input
 * without being clipped by the top bar (~3 profile rows).
 */
const OVERLAY_MAX_HEIGHT = 168

/**
 * Native: Sift's popover positioning doesn't anchor reliably on the login form,
 * so the result list is drawn as an absolutely-positioned overlay directly above
 * the input. Anchoring above keeps it clear of the on-screen keyboard, and
 * overlaying (rather than rendering inline) means it doesn't push the form down.
 * See index.tsx for the web (floating Sift) variant.
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
  const internalInputRef = useRef<TextInput>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    internalInputRef.current?.blur()
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

  return (
    <View style={[a.relative, a.z_20, native({overflow: 'visible'})]}>
      <TextField.Root isInvalid={isInvalid}>
        <TextField.Icon icon={Icon} />
        <TextField.Input
          testID={testID}
          label={label}
          placeholder={placeholder}
          inputRef={mergeRefs([internalInputRef, inputRef])}
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
        <OverlayList items={items} onSelect={onSelect} />
      ) : null}
    </View>
  )
}

function OverlayList({
  items,
  onSelect,
}: {
  items: AutocompleteItem[]
  onSelect: (item: AutocompleteItem) => void
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const draggedRef = useRef(false)

  if (!moderationOpts) return null

  /*
   * The list sits above the input, so reverse it to put the most relevant
   * result (first) at the bottom, nearest the text the user is typing.
   */
  const ordered = [...items].reverse()

  return (
    <View
      style={[
        a.absolute,
        a.z_10,
        a.mb_xs,
        {left: 0, right: 0, bottom: '100%', maxHeight: OVERLAY_MAX_HEIGHT},
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        t.atoms.shadow_lg,
      ]}>
      {/*
       * Gesture-handler ScrollView so vertical drags aren't stolen by the
       * parent LoggedOutLayout ScrollView. delayPressIn on rows lets a drag
       * begin before a press commits.
       */}
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        bounces={false}
        onScrollBeginDrag={() => {
          draggedRef.current = true
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            draggedRef.current = false
          }, 50)
        }}
        onMomentumScrollEnd={() => {
          draggedRef.current = false
        }}>
        {ordered.map((item, index) => {
          if (item.type !== 'profile') return null
          return (
            <TouchableOpacity
              key={item.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              delayPressIn={120}
              onPress={() => {
                if (draggedRef.current) return
                onSelect(item)
              }}
              style={[
                a.py_sm,
                a.px_md,
                index !== 0 && a.border_t,
                t.atoms.border_contrast_low,
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
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}
