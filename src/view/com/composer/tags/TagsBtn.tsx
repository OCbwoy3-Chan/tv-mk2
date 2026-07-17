import {useState} from 'react'
import {Keyboard, View} from 'react-native'
import {UnicodeString} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  HITSLOP_10,
  MAX_BYTES_PER_TAG,
  MAX_GRAPHEME_LENGTH_PER_TAG,
  MAX_TAGS,
} from '#/lib/constants'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

/**
 * Normalize a raw tag input for `app.bsky.feed.post` `tags`.
 * Strips a leading `#`, trims, and enforces lexicon grapheme/byte limits.
 */
export function normalizeOutlineTag(raw: string): string | undefined {
  let tag = raw.trim()
  if (tag.startsWith('#')) {
    tag = tag.slice(1).trim()
  }
  if (!tag) {
    return undefined
  }
  const unicode = new UnicodeString(tag)
  if (
    unicode.graphemeLength > MAX_GRAPHEME_LENGTH_PER_TAG ||
    unicode.length > MAX_BYTES_PER_TAG
  ) {
    return undefined
  }
  return tag
}

export function TagsBtn({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (v: string[]) => void
}) {
  const control = Dialog.useDialogControl()
  const {t: l} = useLingui()
  const hasTags = tags.length > 0

  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="tagsBtn"
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}
        label={l`Tags`}
        accessibilityHint={l`Opens a dialog to add tags to your post`}>
        <ButtonIcon icon={Hashtag} />
        <ButtonText numberOfLines={1} maxFontSizeMultiplier={2}>
          {hasTags ? (
            plural(tags.length, {
              one: '# tag',
              other: '# tags',
            })
          ) : (
            <Trans>Tags</Trans>
          )}
        </ButtonText>
        <ButtonIcon icon={TinyChevronIcon} size="2xs" />
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner tags={tags} onChange={onChange} />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (v: string[]) => void
}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const t = useTheme()
  const [field, setField] = useState('')
  const [error, setError] = useState<string | undefined>()

  const atLimit = tags.length >= MAX_TAGS
  const canAdd = !atLimit && !!field.trim()

  const tryAddTag = (
    raw: string,
    currentTags: string[],
  ): {tags: string[]; error?: string} => {
    const tag = normalizeOutlineTag(raw)
    if (!tag) {
      return {tags: currentTags, error: l`Enter a valid tag`}
    }
    if (currentTags.length >= MAX_TAGS) {
      return {
        tags: currentTags,
        error: l`You can add up to ${MAX_TAGS} tags`,
      }
    }
    if (currentTags.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
      return {tags: currentTags, error: l`This tag is already added`}
    }
    return {tags: [...currentTags, tag]}
  }

  const addTag = (raw: string = field) => {
    const result = tryAddTag(raw, tags)
    if (result.error) {
      setError(result.error)
      return
    }
    onChange(result.tags)
    setField('')
    setError(undefined)
  }

  const onChangeText = (value: string) => {
    if (error) {
      setError(undefined)
    }
    if (!value.includes(',')) {
      setField(value)
      return
    }

    const parts = value.split(',')
    const remainder = parts.pop() ?? ''
    let nextTags = tags
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part.trim()) {
        continue
      }
      const result = tryAddTag(part, nextTags)
      if (result.error) {
        const leftover = [part, ...parts.slice(i + 1), remainder]
          .filter(segment => segment.length > 0)
          .join(',')
        setField(leftover)
        setError(result.error)
        if (nextTags !== tags) {
          onChange(nextTags)
        }
        return
      }
      nextTags = result.tags
    }
    if (nextTags !== tags) {
      onChange(nextTags)
    }
    setField(remainder)
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(existing => existing !== tag))
    setError(undefined)
  }

  return (
    <Dialog.ScrollableInner
      label={l`Add tags`}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            <Trans>Add tags</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              Tags help people find your post. They are stored separately from
              the post text, so they do not count toward the character limit.
            </Trans>
          </Text>
        </View>

        <View style={[a.gap_sm]}>
          <View style={[a.w_full, a.relative]}>
            <Dialog.Input
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="off"
              returnKeyType="done"
              blurOnSubmit={false}
              label={l`Enter a tag`}
              placeholder={l`e.g. photography`}
              value={field}
              editable={!atLimit}
              onChangeText={onChangeText}
              onSubmitEditing={() => addTag()}
              style={[{paddingRight: 40}]}
            />
            <View
              style={[
                a.absolute,
                a.z_20,
                a.my_auto,
                a.inset_0,
                a.justify_center,
                a.pr_sm,
                {left: 'auto'},
              ]}>
              <Button
                testID="addTagBtn"
                onPress={() => addTag()}
                label={l`Add tag`}
                hitSlop={HITSLOP_10}
                size="tiny"
                shape="round"
                variant="ghost"
                color="secondary"
                disabled={!canAdd}>
                <ButtonIcon icon={Plus} size="sm" />
              </Button>
            </View>
          </View>
          {error ? (
            <Text style={[{color: t.palette.negative_500}, a.leading_snug]}>
              {error}
            </Text>
          ) : (
            <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
              <Trans>
                {tags.length} of {MAX_TAGS} tags
              </Trans>
            </Text>
          )}
        </View>

        {tags.length > 0 ? (
          <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
            {tags.map(tag => (
              <Button
                key={tag}
                label={l`Remove #${tag}`}
                onPress={() => removeTag(tag)}
                color="secondary"
                size="small">
                <ButtonText>#{tag}</ButtonText>
                <ButtonIcon icon={X} size="xs" />
              </Button>
            ))}
          </View>
        ) : null}
      </View>

      <View style={[a.mt_lg, web([a.flex_row, a.ml_auto])]}>
        <Button
          label={l`Done`}
          onPress={() => control.close()}
          color="primary"
          size={IS_WEB ? 'small' : 'large'}
          variant="solid"
          testID="confirmTagsBtn">
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
