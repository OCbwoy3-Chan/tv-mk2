import {type AnyProfileView} from '#/types/bsky/profile'

type MinorRestriction = 'explicit' | 'none'

const MDNI = /(?<![\p{L}\p{N}_])#?mdni(?![\p{L}\p{N}_])/iu
const MDNI_NAME_EMOJIS = /🔞/iu

const META_BEFORE =
  /(?:\b(?:what(?:'?s| is| does)?|meaning of|definition of|term|phrase|word|means?|explaining?|discuss(?:ing)?|criticiz(?:e|ing)|against|oppose|hate|dislike|says?|said|quot(?:e|ed|ing)|mentions?|reference|post about|guide to)\s+(?:(?:the|a|an|term|phrase|word)\s+)*|\banti[- ]?)$/iu

const META_AFTER =
  /^\s*[!,:-]?\s*(?:\b(?:means?|refers? to|does not mean|is (?:an? emoji|stupid|annoying|silly)|quot(?:e|ed|ing)|mentioned)\b|\?)/iu

const NEGATED =
  /\b(?:not|never|isn't|isnt)\s+(?:(?:be|go|become)\s+)?(?:#?mdni|(?:18|21)\s*\+|🔞|adults?\s+only)(?![\p{L}\p{N}_])|\b(?:don't|dont|do not|doesn't|doesnt)\s+(?:use|have|enforce|follow)\s+#?mdni\b|\bminors?\s+(?:are|is)\s+(?:welcome|allowed)\b/iu

const EXCLUDED =
  /\bdni\s*:\s*(?:#?mdni\b|(?:18|21)\s*\+\s*(?:accounts?|users?|people)\b)|\b#?mdni\s+(?:accounts?|users?|people|supporters?)\s+(?:dni|dnf|do not interact)\b|\b(?:18|21)\s*\+\s*(?:accounts?|users?|people)?(?:\s*,[^.!?\r\n]*)?\s*(?:dni|dnf|do not interact)\b/iu

const RESTRICTIONS = [
  /\bminors?\s*,?\s*(?:please\s+|pls\s+)?(?:dni|dnf|do\s+not\s+(?:interact|follow)|don't\s+(?:interact|follow)|stay\s+away|go\s+away|begone|keep\s+out)\b/iu,
  /\b(?:dni|dnf|do not interact)\s+minors?\b/iu,
  /\bno\s+minors?(?=\s*(?:$|[!.,🚫🔒✨⭐\r\n|•·;]|(?:please|pls|allowed|here)\b))/iu,
  /\b(?:under\s*(?:18|21)|u18|u21)\s*[-,:]?\s*(?:dni|dnf|do\s+not\s+interact|not\s+allowed)\b/iu,
  /\b(?:18|21)\s*\+(?=\s*(?:$|[\r\n]|[^\p{L}\p{N}_\s]|(?:only|accounts?|nsfw|sfw|mdni)\b))/iu,
  /\badults?\s+only\b|\bonly\s+adults\b/iu,
  /\bminors?\s+(?:not\s+allowed|not\s+welcome|keep\s+out)\b/iu,
]

function hasRestriction(
  text: string | undefined,
  restrictions: RegExp[],
): boolean {
  if (!text?.trim()) return false

  const cleaned = text
    .replace(/[’‘]/gu, "'")
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/giu, ' ')
    .replace(/^\s*>.*$/gm, '')
    .replace(/["“][^"”\n]*["”]/gu, ' ')
    .replace(new RegExp(EXCLUDED, 'giu'), ' ')
    .replace(new RegExp(NEGATED, 'giu'), ' ')

  for (const restriction of restrictions) {
    for (const match of cleaned.matchAll(new RegExp(restriction, 'giu'))) {
      const before = cleaned.slice(0, match.index)
      const after = cleaned.slice(match.index + match[0].length)

      if (!META_BEFORE.test(before) && !META_AFTER.test(after)) {
        return true
      }
    }
  }

  return false
}

/** Explicit means MINORS DNI!! */
export function classifyMinorRestriction(
  text: string | undefined,
): MinorRestriction {
  return hasRestriction(text, [MDNI, MDNI_NAME_EMOJIS, ...RESTRICTIONS])
    ? 'explicit'
    : 'none'
}

export const hasMdni = (text: string | undefined): boolean =>
  classifyMinorRestriction(text) === 'explicit'

/** Check if a user is MDNI */
export function checkForMdni(user: AnyProfileView): boolean {
  return [
    user.displayName && classifyMinorRestriction(user.displayName),
    'description' in user && classifyMinorRestriction(user.description),
  ].some(a => a === 'explicit')
}

export function shouldShowMdniBadge(user: AnyProfileView): boolean {
  if (!checkForMdni(user)) return false
  if (
    user.displayName &&
    hasRestriction(user.displayName, [MDNI_NAME_EMOJIS])
  ) {
    return false
  }
  return true
}
