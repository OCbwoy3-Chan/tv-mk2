import { AnyProfileView } from "#/types/bsky/profile"

type MinorRestriction = 'explicit' | 'none'

const MDNI = /(?<![\p{L}\p{N}_])#?mdni(?![\p{L}\p{N}_])/iu
const MDNI_NAME_EMOJIS = /🔞/iu

const META =
    /\b(?:what(?:'?s| is| does)?|meaning|definition|term|phrase|means?|refers? to|explaining?|discuss(?:ing)?|criticiz(?:e|ing)|against|oppose|hate|dislike|stupid|annoying|silly|says?|said|quote|quoting|mentions?|reference|anti[- ]?mdni)\b/iu

const NEGATED =
    /\b(?:not|never|isn't|isnt)\s+(?:#?mdni|18\s*\+|adults?\s+only)\b|\b(?:don't|dont|do not|doesn't|doesnt)\s+(?:use|have|enforce|follow)\s+#?mdni\b|\bminors?\s+(?:are|is)\s+(?:welcome|allowed)\b/iu

const EXCLUDED =
    /\bdni\s*:\s*#?mdni\b|\b#?mdni\s+(?:accounts?|users?|people|supporters?)\s+(?:dni|dnf|do not interact)\b/iu

const RESTRICTIONS = [
    /\bminors?\s*,?\s*(?:please\s+|pls\s+)?(?:dni|dnf|do\s+not\s+(?:interact|follow)|don't\s+(?:interact|follow)|stay\s+away|go\s+away|begone|keep\s+out)\b/iu,
    /\bno\s+minors?\s*(?:[,!]\s*(?:please|pls)\b|\b(?:please|pls|allowed|here)\b|[!.,]?\s*$)/iu,
    /\b(?:under\s*(?:18|21)|u18|u21)\s*[-,:]?\s*(?:dni|dnf|do\s+not\s+interact|not\s+allowed)\b/iu,
    /\b(?:18|21)\s*\+\s*(?:only|account|acc|page|profile)\b/iu,
    /\badults?\s+only\b|\bonly\s+adults\b/iu,
    /\bminors?\s+(?:not\s+allowed|not\s+welcome|keep\s+out)\b/iu,
]

/** Explicit means MINORS DNI!! */
export function classifyMinorRestriction(
    text: string | undefined,
): MinorRestriction {
    if (!text?.trim()) return 'none'

    const cleaned = text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/https?:\/\/\S+|www\.\S+/giu, ' ')
        .replace(/^\s*>.*$/gm, '')
        .replace(/["“][^"”\n]*["”]/gu, ' ')

    for (const raw of cleaned.split(/[\r\n|•·;]+/u)) {
        const clause = raw.trim()

        if (!clause) continue
        if (META.test(clause)) continue
        if (NEGATED.test(clause)) continue
        if (EXCLUDED.test(clause)) continue

        if (/🔞/u.test(clause)) return 'explicit'

        const normalized = clause.replace(/[🔞🚫🔒✨⭐]+/gu, ' ').trim()

        if (RESTRICTIONS.some((re) => re.test(normalized))) {
            return 'explicit'
        }

        const match = MDNI.exec(normalized)
        if (!match) continue

        const before = normalized.slice(0, match.index).trim()
        const after = normalized.slice(match.index + match[0].length).trim()

        if (
            !before &&
            (!after ||
                /^[!,./?()[\]\s]/u.test(after) ||
                /^(?:nsfw|18\+|21\+)/iu.test(after))
        ) {
            return 'explicit'
        }

        if (
            !after &&
            /^(?:nsfw|18\+|21\+|dni|\d{1,2}(?:\s*(?:years?\s*old|yo))?\s*)$/iu.test(
                before,
            )
        ) {
            return 'explicit'
        }
    }

    return 'none'
}

export const hasMdni = (text: string | undefined): boolean =>
    classifyMinorRestriction(text) === "explicit"

/** Check if a user is MDNI */
export function checkForMdni(user: AnyProfileView): boolean {
    return [
        (user.displayName) && classifyMinorRestriction(user.displayName),
        ("description" in user) && classifyMinorRestriction(user.description)
    ].some(a => a === "explicit")
}

export function shouldShowMdniBadge(user: AnyProfileView): boolean {
    if (!checkForMdni(user)) return false;
    if (user.displayName && MDNI_NAME_EMOJIS.test(user.displayName)) return false;
    return true;
}
