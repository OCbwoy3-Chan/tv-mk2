import {type ComposerOpts} from '#/state/shell/composer'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {type Recovery} from './codec'

export function readRecovery(_did: string): Recovery | undefined {
  return undefined
}

export function saveRecovery(
  _did: string,
  _opts: ComposerOpts,
  _state: ComposerState,
): void {}

export function clearRecovery(_did: string): void {}
