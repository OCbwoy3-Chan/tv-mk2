import {useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {type EventCover} from '#/lib/api/event'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {compressIfNeeded} from '#/lib/media/manip'
import {openCamera, openCropper, openPicker} from '#/lib/media/picker'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  type ComposerImage,
  compressImage,
  createComposerImage,
} from '#/state/gallery'
import {EditImageDialog} from '#/view/com/composer/photos/EditImageDialog'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Camera_Stroke2_Corner0_Rounded as CameraIcon} from '#/components/icons/Camera'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {IS_NATIVE} from '#/env'

/*
 * A cover is never shown larger than the event page's 240pt poster, so 1000px
 * is plenty, and a JPEG that size usually fits on the first try.
 */
const EVENT_COVER_SIZE = {maxDimension: 1000, maxSize: 1000000}

/* The event page shows the poster square, so the preview is square too. */
const TILE = 96

/**
 * Picks an event's cover image, cropped square to match the event poster.
 * `cover` is the image to preview: a picked file or the current cover URL.
 */
export function EventCoverPicker({
  cover,
  onChange,
  placeholder,
}: {
  cover?: string
  onChange: (cover: EventCover | null) => void
  /** Shown in the preview when there is no cover, e.g. the stand-in poster. */
  placeholder?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const editControl = useDialogControl()
  const [rawImage, setRawImage] = useState<ComposerImage | undefined>()

  const pick = (image: {
    path: string
    mime: string
    width: number
    height: number
  }) =>
    onChange({
      path: image.path,
      mime: image.mime,
      width: image.width,
      height: image.height,
    })

  const onCamera = async () => {
    if (!(await requestCameraAccessIfNeeded())) return
    try {
      const image = await openCamera({aspect: [1, 1]})
      if (image) pick(await compressIfNeeded(image, EVENT_COVER_SIZE))
    } catch (e) {
      if (!isCancelledError(e)) {
        logger.warn('Failed to take event cover photo', {safeMessage: e})
      }
    }
  }

  const onLibrary = async () => {
    if (!(await requestPhotoAccessIfNeeded())) return
    const items = await sheetWrapper(openPicker({aspect: [1, 1]}))
    const item = items[0]
    if (!item) return
    try {
      if (IS_NATIVE) {
        pick(
          await compressIfNeeded(
            await openCropper({
              imageUri: item.path,
              aspectRatio: 1,
              format: 'jpeg',
              compressImageQuality: 0.9,
            }),
            EVENT_COVER_SIZE,
          ),
        )
      } else {
        setRawImage(await createComposerImage(item))
        editControl.open()
      }
    } catch (e) {
      if (!isCancelledError(e)) {
        logger.error('Failed to pick event cover', {safeMessage: e})
      }
    }
  }

  const chooseLabel = cover ? l`Change cover image` : l`Add cover image`
  /*
   * On native this is the menu's trigger, and the menu's own press handler
   * arrives in `props`; it must not be overridden. On web it opens files.
   */
  const chooseButton = (props?: object) => (
    <Button
      testID="eventCoverPickBtn"
      {...(props ?? {onPress: () => void onLibrary()})}
      label={chooseLabel}
      size="small"
      color="secondary">
      <ButtonIcon icon={cover ? ImageIcon : PlusIcon} />
      <ButtonText>{chooseLabel}</ButtonText>
    </Button>
  )

  return (
    <>
      <View>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.overflow_hidden,
              a.rounded_lg,
              t.atoms.bg_contrast_50,
              {width: TILE, height: TILE},
            ]}>
            {cover ? (
              <Image
                testID="eventCoverImage"
                source={{uri: cover}}
                alt={l`Cover image`}
                style={[a.absolute, a.inset_0]}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              (placeholder ?? (
                <ImageIcon size="xl" style={t.atoms.text_contrast_low} />
              ))
            )}
          </View>
          <View style={[a.flex_1, a.align_start, a.gap_sm]}>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              {IS_NATIVE ? (
                <Menu.Root>
                  <Menu.Trigger label={chooseLabel}>
                    {({props}) => chooseButton(props)}
                  </Menu.Trigger>
                  <Menu.Outer showCancel>
                    <Menu.Group>
                      <Menu.Item
                        testID="eventCoverCameraBtn"
                        label={l`Upload from Camera`}
                        onPress={() => void onCamera()}>
                        <Menu.ItemText>
                          <Trans>Upload from Camera</Trans>
                        </Menu.ItemText>
                        <Menu.ItemIcon icon={CameraIcon} />
                      </Menu.Item>
                      <Menu.Item
                        testID="eventCoverLibraryBtn"
                        label={l`Upload from Library`}
                        onPress={() => void onLibrary()}>
                        <Menu.ItemText>
                          <Trans>Upload from Library</Trans>
                        </Menu.ItemText>
                        <Menu.ItemIcon icon={LibraryIcon} />
                      </Menu.Item>
                    </Menu.Group>
                  </Menu.Outer>
                </Menu.Root>
              ) : (
                chooseButton()
              )}
              {!!cover && (
                <Button
                  testID="eventCoverRemoveBtn"
                  label={l`Remove cover image`}
                  size="small"
                  color="secondary"
                  onPress={() => onChange(null)}>
                  <ButtonIcon icon={TrashIcon} />
                  <ButtonText>
                    <Trans>Remove cover</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
      <EditImageDialog
        control={editControl}
        image={rawImage}
        onChange={(image: ComposerImage) =>
          void compressImage(image, EVENT_COVER_SIZE).then(pick)
        }
        aspectRatio={1}
      />
    </>
  )
}
