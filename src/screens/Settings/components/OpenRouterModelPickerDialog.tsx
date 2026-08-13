import {useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type OpenRouterModel,
  useOpenRouterVisionModelsQuery,
} from '#/state/queries/openrouter-models'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {SearchInput} from '#/components/forms/SearchInput'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export function OpenRouterModelPickerDialog({
  control,
  model,
  onSave,
}: {
  control: Dialog.DialogControlProps
  model?: string
  onSave: (model: string) => void
}) {
  const [selected, setSelected] = useState(model ?? '')

  useEffect(() => setSelected(model ?? ''), [model])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{fullHeight: true}}
      onClose={() => {
        if (selected) onSave(selected)
      }}>
      <Dialog.Handle />
      <ModelPickerInner selected={selected} setSelected={setSelected} />
    </Dialog.Outer>
  )
}

function ModelPickerInner({
  selected,
  setSelected,
}: {
  selected: string
  setSelected: (model: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const [search, setSearch] = useState('')
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const {data: models, error, isPending} = useOpenRouterVisionModelsQuery()

  const entries = useMemo(() => {
    const available = models ?? []
    const withSaved =
      selected && !available.some(entry => entry.id === selected)
        ? [
            {
              id: selected,
              name: selected,
              architecture: {
                input_modalities: ['image'],
                output_modalities: ['text'],
              },
            },
            ...available,
          ]
        : available
    const needle = search.trim().toLowerCase()
    if (!needle) return withSaved
    return withSaved.filter(
      entry =>
        entry.name.toLowerCase().includes(needle) ||
        entry.id.toLowerCase().includes(needle),
    )
  }, [models, search, selected])

  const header = (
    <View
      onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
      style={[a.gap_md, a.pb_md, t.atoms.bg, IS_NATIVE && a.pt_2xl]}>
      <Text style={[a.text_xl, a.font_semi_bold]}>
        <Trans>Choose an OpenRouter model</Trans>
      </Text>
      <SearchInput
        value={search}
        onChangeText={setSearch}
        onClearText={() => setSearch('')}
        label={_(msg`Search OpenRouter models`)}
        placeholder={_(msg`Search models`)}
        autoFocus
        maxLength={100}
      />
      {isPending && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Loading models…</Trans>
        </Text>
      )}
      {error && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>
            Could not load models. Your saved model is still available.
          </Trans>
        </Text>
      )}
    </View>
  )

  return (
    <Toggle.Group
      type="radio"
      values={selected ? [selected] : []}
      onChange={values => setSelected(values[0] ?? '')}
      label={_(msg`Choose an OpenRouter model`)}
      style={web([a.contents])}>
      <Dialog.InnerFlatList
        data={entries}
        keyExtractor={(entry: OpenRouterModel) => entry.id}
        ListHeaderComponent={header}
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          !isPending ? (
            <Text
              style={[a.py_2xl, a.text_center, t.atoms.text_contrast_medium]}>
              <Trans>No matching image-capable models.</Trans>
            </Text>
          ) : null
        }
        contentContainerStyle={[
          IS_NATIVE && {paddingBottom: footerHeight + tokens.space.xl},
        ]}
        style={[IS_NATIVE && a.px_lg, web({paddingBottom: 100})]}
        scrollIndicatorInsets={{top: headerHeight, bottom: footerHeight}}
        renderItem={({item, index}: {item: OpenRouterModel; index: number}) => (
          <Toggle.Item
            name={item.id}
            label={`${item.name}, ${item.id}`}
            style={[
              a.py_md,
              a.rounded_0,
              index < entries.length - 1 && a.border_b,
              t.atoms.border_contrast_low,
            ]}>
            <View style={[a.flex_1, a.gap_2xs]}>
              <Toggle.LabelText>{item.name}</Toggle.LabelText>
              <Text
                numberOfLines={1}
                style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {item.id}
              </Text>
            </View>
            <Toggle.Radio />
          </Toggle.Item>
        )}
        footer={
          <Dialog.FlatListFooter
            onLayout={event =>
              setFooterHeight(event.nativeEvent.layout.height)
            }>
            <Button
              label={_(msg`Save model`)}
              onPress={() => control.close()}
              disabled={!selected}
              color="primary"
              size="large">
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </Dialog.FlatListFooter>
        }
      />
    </Toggle.Group>
  )
}
