import {device, useStorage} from '#/storage'

/** Shared across video embeds and remembered on this device. */
export function useVideoPlaybackSpeed() {
  const [speed = 1, setSpeed] = useStorage(device, ['videoPlaybackSpeed'])
  return [speed, setSpeed] as const
}
