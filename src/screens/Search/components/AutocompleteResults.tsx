import {memo} from 'react'
import {TouchableOpacity, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {parseSearchLink} from '#/lib/routes/searchLink'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {SearchProfileCard} from '#/screens/Search/components/SearchProfileCard'
import {atoms as a, native, useTheme} from '#/alf'
import {type AutocompleteItem} from '#/components/Autocomplete'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

let AutocompleteResults = ({
  items,
  isFetching,
  searchText,
  onSubmit,
  onOpenLink,
  onResultPress,
  onProfileClick,
}: {
  items: AutocompleteItem[]
  isFetching: boolean
  searchText: string
  onSubmit: () => void
  onOpenLink: (value: string) => void
  onResultPress: () => void
  onProfileClick: (profile: bsky.profile.AnyProfileView) => void
}): React.ReactNode => {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()

  return (
    <Layout.Content
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <SearchLinkCard
        label={l`Search for “${searchText}”`}
        onPress={native(onSubmit)}
        to={
          IS_NATIVE ? undefined : `/search?q=${encodeURIComponent(searchText)}`
        }
        style={a.border_b}
      />
      {parseSearchLink(searchText) && (
        <SearchLinkCard
          label={l`Open link`}
          onPress={() => onOpenLink(searchText)}
          style={a.border_b}
          testID="autocompleteOpenLink"
        />
      )}
      {isFetching && !items.length && (
        <View style={[a.py_xl, a.align_center]}>
          <Loader size="xl" color={t.palette.primary_500} />
        </View>
      )}
      {items.map((item, index) => {
        if (item.type !== 'profile' || !moderationOpts) return null
        return (
          <SearchProfileCard
            key={item.key}
            profile={item.profile}
            moderationOpts={moderationOpts}
            onPress={() => {
              ax.metric('search:autocomplete:press', {
                profileDid: item.profile.did,
                position: index,
              })
              onProfileClick(item.profile)
              onResultPress()
            }}
          />
        )
      })}
      <View style={{height: 200}} />
    </Layout.Content>
  )
}
AutocompleteResults = memo(AutocompleteResults)
export {AutocompleteResults}

let SearchLinkCard = ({
  label,
  to,
  onPress,
  style,
  testID,
}: {
  label: string
  to?: string
  onPress?: () => void
  style?: ViewStyle
  testID?: string
}): React.ReactNode => {
  const t = useTheme()

  const inner = (
    <View
      style={[a.flex_1, a.py_lg, a.px_md, t.atoms.border_contrast_low, style]}>
      <Text emoji style={[a.text_md, t.atoms.text]}>
        {label}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityHint="">
        {inner}
      </TouchableOpacity>
    )
  }

  if (to) {
    return (
      <Link label={label} to={to}>
        {inner}
      </Link>
    )
  }

  return inner
}
