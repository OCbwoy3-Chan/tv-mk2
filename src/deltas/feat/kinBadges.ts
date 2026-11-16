import { AnyProfileView } from "#/types/bsky/profile"
import { ImageProps } from "react-native"

export type KinBadge = {
    name: string
    id: string
    img: ImageProps["source"]
    /**
     * ENGLISH ONLY (LATVIAN IS UNSUPPORTED).
     * **Names starting with wovels (aeiou) must be "an"!!**
     * Default to "a" if not provided
     */
    article?: "a" | "an"
}

export type KinBadgeToplevel = {
    group: string
    id: string
    badges: KinBadge[],
    kinsEnabled?: boolean
}

export type KinBadgeType = {
    name: string
    id: string
    /**
     * For the badge info popup.
     * %c -> Character Franchise
     * %a -> Article (a/an)
     */
    showAs?: string
}

export const KIN_BADGE_TYPES: KinBadgeType[] = [
    {
        name: "I just want the badge",
        id: "badge",
        showAs: "This user chose to have %a %c badge on their profile.",
    },
    {
        name: "I'm them",
        id: "s",
        showAs: "They're %c.",
    },
    {
        name: "Fictive",
        id: "fictive",
        showAs: "They're %a %s fictive.",
    },
    {
        name: "Fictionkin",
        id: "fictionkin",
        showAs: "They're %a %s fictionkin.",
    },
    {
        name: "Otherkin",
        id: "otherkin",
        showAs: "They're %a %s otherkin.",
    },
]

export const KIN_BADGES: KinBadgeToplevel[] = [
    // {
    //     group: "ATProtoverse",
    //     id: "at",
    //     badges: [
    //         {
    //             name: "Kris",
    //             id: "kris",
    //             img: require("#/../assets/badges/kris.png"),
    //         },
    //     ]
    // },
    {
        group: "Deltarune",
        id: "dr",
        kinsEnabled: true,
        badges: [
            {
                name: "Kris",
                id: "kris",
                img: require("#/../assets/badges/kris.png"),
            },
            {
                name: "Susie",
                id: "susie",
                img: require("#/../assets/badges/susie.png"),
            },
            {
                name: "Ralsei",
                id: "ralsei",
                img: require("#/../assets/badges/ralsei.png"),
            },
            {
                name: "Noelle",
                id: "noelle",
                img: require("#/../assets/badges/noelle.png"),
            },
        ],
    },
]

/** check if a selflabel is a kin badge label */
export function isKinBadge(label: { val: string }) {
    for (const group of KIN_BADGES) {
        for (const badge of group.badges) {
            const kin = KIN_BADGE_TYPES.find(
                type => label.val === group.id + "-" + badge.id + "-" + type.id,
            )
            if (kin) return { has: true, id: group.id, badge: badge.id, kin: kin.id }
        }
    }
    return null
}

/** get *the* kin badge for a user */
export function getKinBadge(user: AnyProfileView): {
    has: boolean
    id: string
    badge: string
    kin: string
} {
    const selfLabels = user.labels?.filter(lb => {
        if (lb.src !== user.did) return false
        if (lb.uri === `at://${user.did}/app.bsky.actor.profile/self`) return true
        return false
    })

    for (const label of selfLabels ?? []) {
        const badge = isKinBadge(label)
        if (badge) return badge
    }

    return { has: false, id: "dr", badge: "gaster", kin: "s" }
}
