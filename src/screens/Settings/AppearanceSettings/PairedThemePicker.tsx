import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {useAccountThemesQuery} from '#/features/themes/api'
import {ThemeCard} from '#/features/themes/ThemeCard'
import {type ThemeMode} from '#/features/themes/types'

export function PairedThemePicker({
  control,
  mode,
  onSelect,
}: {
  control: Dialog.DialogControlProps
  mode: ThemeMode
  onSelect: (uri: string) => void
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Contents control={control} mode={mode} onSelect={onSelect} />
    </Dialog.Outer>
  )
}

function Contents({
  control,
  mode,
  onSelect,
}: {
  control: Dialog.DialogControlProps
  mode: ThemeMode
  onSelect: (uri: string) => void
}) {
  const {t: l} = useLingui()
  const title =
    mode === 'light'
      ? l`Choose a paired light theme`
      : l`Choose a paired dark theme`
  const library = useAccountThemesQuery()
  const [search, setSearch] = useState('')
  const themes = (library.data?.pages.flatMap(page => page.items) ?? []).filter(
    theme =>
      theme.record.mode === mode &&
      theme.record.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <Dialog.ScrollableInner label={title}>
      <View style={[a.gap_md]}>
        <Text style={[a.text_xl, a.font_bold]}>{title}</Text>
        <TextField.Input
          testID="pairedThemeSearchInput"
          label={l`Search your themes`}
          placeholder={l`Search your themes`}
          defaultValue=""
          onChangeText={setSearch}
        />
        {library.isPending ? (
          <Text>
            <Trans>Loading themes…</Trans>
          </Text>
        ) : library.isError ? (
          <>
            <Text>
              <Trans>Could not load your themes.</Trans>
            </Text>
            <Button
              label={l`Retry`}
              size="small"
              color="secondary"
              onPress={() => void library.refetch()}>
              <ButtonText>
                <Trans>Retry</Trans>
              </ButtonText>
            </Button>
          </>
        ) : themes.length === 0 ? (
          <Text>
            <Trans>No matching themes.</Trans>
          </Text>
        ) : (
          <View style={[a.flex_row, a.flex_wrap, a.gap_lg]}>
            {themes.map(theme => (
              <ThemeCard
                key={theme.uri}
                theme={theme}
                showMenu={false}
                label={l`Pair with ${theme.record.name}`}
                onPress={() => control.close(() => onSelect(theme.uri))}
              />
            ))}
          </View>
        )}
        {library.hasNextPage && (
          <Button
            label={l`Load more themes`}
            size="small"
            color="secondary"
            disabled={library.isFetchingNextPage}
            onPress={() => void library.fetchNextPage()}>
            <ButtonText>
              <Trans>Load more themes</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
