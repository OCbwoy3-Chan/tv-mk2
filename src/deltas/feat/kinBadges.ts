import { AnyProfileView } from "#/types/bsky/profile"
import { ImageProps } from "react-native"

export type KinBadge = {
    name: string
    id: string
    img: ImageProps["source"]
    /**
     * Tēla vārda gramatiskais artikuls angļu valodā.
     * Izmanto "an", ja vārds sākas ar patskani (aāeēiīuūo).
     * Ja sākas ar līdzkani vai jebko citu, izmanto "a".
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
     * Žetona info teksts angliski.
     * %c -> Tēla grupa
     * %a -> Angļu val gramatiskais artikuls (a/an)
     */
    showAs?: {
        /** Apraksts, kad skaties savu žetonu (savādāk lieto `others`) */
        you?: string,
        /** Apraksts, kad skaties citu vai `you` vērtība nav definēta */
        others: string
    } | string
}

export const KIN_BADGE_TYPES: KinBadgeType[] = [
    {
        name: "I just want the badge",
        id: "badge",
        showAs: {
            you: "You have %a %c badge.",
            others: "%c."
        },
    },
    {
        name: "I'm",
        id: "s",
        showAs: {
            you: "You're %c.",
            others: "They're %c."
        },
    },
    {
        name: "Favorite character",
        id: "fav",
        showAs: {
            you: "Your favorite character is %c.",
            others: "Their favorite character is %c."
        },
    },
    {
        name: "Fictive",
        id: "fictive",
        showAs: {
            you: "You're %a %s fictive.",
            others: "They're %a %s fictive."
        },
    },
    {
        name: "Fictionkin",
        id: "fictionkin",
        showAs: {
            you: "You're %a %s fictionkin.",
            others: "They're %a %s fictionkin."
        },
    },
    {
        name: "Otherkin",
        id: "otherkin",
        showAs: {
            you: "You're %a %s otherkin.",
            others: "They're %a %s otherkin."
        },
    },
]

export const KIN_BADGES: KinBadgeToplevel[] = [
    {
        group: "ATProtoverse",
        id: "at",
        badges: [
            {
                name: "Bluesky",
                id: "bsky",
                img: require("#/../assets/badges/bsky.svg"),
            },
            {
                name: "Witchsky",
                id: "witchsky",
                img: require("#/../assets/badges/witchsky.svg"),
            }
        ]
    },
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

/** pārbauda vai pašatzīme ir kina žetona atzīme */
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

/** dabū kaut kāda lietotāja kina žetona datus */
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
