import {type ComposerOpts} from '#/state/shell/composer'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {type Recovery} from './codec'

let recovery: Recovery | undefined

export function readRecovery(_did: string): Recovery | undefined {
  if (!recovery) return undefined
  return {
    ...recovery,
    state: {...recovery.state, mutableNeedsFocusActive: true},
  }
}

export function saveRecovery(
  _did: string,
  opts: ComposerOpts,
  state: ComposerState,
): void {
  recovery = {
    version: 1,
    opts: {activeAccountDid: opts.activeAccountDid, replyTo: opts.replyTo},
    state,
  }
}

export function clearRecovery(_did: string): void {
  recovery = undefined
}
