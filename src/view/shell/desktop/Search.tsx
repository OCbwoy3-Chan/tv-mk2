import {useRef, useState} from 'react'
import {type TextInput, View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {StackActions, useNavigation} from '@react-navigation/native'

import {mergeRefs} from '#/lib/merge-refs'
import {makeProfileLink} from '#/lib/routes/links'
import {parseSearchLink} from '#/lib/routes/searchLink'
import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {
  Autocomplete as AutocompleteBase,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'
import {router} from '#/routes'

export function DesktopSearch() {
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const navigation = useNavigation<NavigationProp>()
  const [active, setActive] = useState(false)
  const [query, setQuery] = useState<string>('')
  const showResults = active && !!query.length

  const sift = useSift({
    offset: a.p_sm.padding,
    placement: 'bottom',
  })

  const onFocus = () => {
    if (query.length) setActive(true)
  }

  const onBlur = () => {
    setActive(false)
  }

  const onChangeText = (text: string) => {
    setQuery(text)
    if (!active) {
      setActive(true)
    }
  }

  const onClearText = () => {
    setQuery('')
    setActive(false)
  }

  const onSubmit = () => {
    if (!query.length) return
    onClearText()
    inputRef.current?.blur()
    navigation.dispatch(StackActions.push('Search', {q: query}))
  }

  const onSelect = (item: AutocompleteItem) => {
    if (item.type === 'profile') {
      onClearText()
      inputRef.current?.blur()
      const [screen, params] = router.matchPath(makeProfileLink(item.profile))
      // @ts-expect-error TODO: type matchPath well enough that it can be plugged into navigation.navigate directly
      navigation.navigate(screen, params)
    } else if (item.type === 'search') {
      onClearText()
      inputRef.current?.blur()
      navigation.navigate('Search', {q: item.value})
    } else if (item.type === 'open-link') {
      const link = parseSearchLink(item.value)
      if (link) {
        onClearText()
        inputRef.current?.blur()
        navigation.dispatch(StackActions.push(link.screen, link.params))
      }
    }
  }

  return (
    <View collapsable={false} ref={sift.refs.setAnchor}>
      <SearchInput
        hotkey
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onClearText={onClearText}
        onSubmitEditing={onSubmit}
        {...sift.targetProps}
        ref={mergeRefs([sift.targetProps.ref, inputRef])}
      />
      {showResults && (
        <Inner
          query={query}
          sift={sift}
          onSelect={onSelect}
          onDismiss={() => setActive(false)}
        />
      )}
    </View>
  )
}

function Inner({
  query,
  sift,
  onSelect,
  onDismiss,
}: {
  query: string
  sift: ReturnType<typeof useSift>
  onSelect: (item: AutocompleteItem) => void
  onDismiss: () => void
}) {
  const {items} = useAutocomplete({
    type: 'profile',
    query,
    showSearchFallback: true,
  })

  return items && items.length ? (
    <AutocompleteBase
      sift={sift}
      data={items}
      onSelect={onSelect}
      onDismiss={onDismiss}
    />
  ) : null
}
