import {EventEmitter} from 'eventemitter3'

import {type Emoji} from '#/components/EmojiPicker'

type TextInputWebEvents = {
  publish: []
  'media-pasted': [uri: string]
  'add-post': []
  'move-post': [direction: 'up' | 'down']
  'emoji-inserted': [emoji: Emoji]
}

export const textInputWebEmitter = new EventEmitter<TextInputWebEvents>()
