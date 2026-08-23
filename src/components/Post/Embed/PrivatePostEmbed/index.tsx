import { atoms as a, useTheme } from "#/alf";
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from "#/components/icons/CircleX";
import { RichText } from "#/components/RichText";
import { Text } from "#/components/Typography";
import { View } from "react-native";
import { RichText as RichTextApi } from "@atproto/api"
import { MAX_POST_LINES } from "#/lib/constants";
import { useMemo, useState } from "react";
import { countLines } from "#/lib/strings/helpers";
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from "#/components/icons/Lock";
import { PostEmbedViewContext } from "../types";

function InvalidEmbed({ reason }: { reason: string }) {
    const t = useTheme();
    return <View
        style={[
            a.transition_color,
            a.flex_col,
            a.rounded_md,
            a.overflow_hidden,
            a.w_full,
            a.border,
            t.atoms.bg,
            t.atoms.border_contrast_low
        ]}>
        <View style={[
            a.p_md,
            a.flex_row
        ]}>
            <CircleXIcon style={[
                a.pr_sm,
                t.atoms.text_contrast_medium
            ]} />
            <Text style={[
                a.text_md
            ]}>{reason}</Text>
        </View>
    </View>
}

export function PrivatePostEmbed({ metadata, viewContext = PostEmbedViewContext.ThreadHighlighted }: { metadata: string, viewContext: PostEmbedViewContext | undefined }) {
    const t = useTheme();

    const [uri, cid] = metadata.split("|");

    if (!uri.startsWith("at://")) return <InvalidEmbed reason="Invalid private post at-uri" />
    if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/.test(cid)) return <InvalidEmbed reason="Invalid private post CID" />

    // return <InvalidEmbed reason="stub"/>

    const postText = `you can't even tell a difference between a normal and a private post when it's shown
    
just that lil lock above the post on this stub post #testing`+viewContext

    const richText = useMemo(() => {
        // if (!description) return
        const rt = new RichTextApi({ text: postText || '' })
        rt.detectFacetsWithoutResolution()
        return rt
    }, [postText])

    const [limitLines, setLimitLines] = useState(
        () => countLines(richText?.text) >= MAX_POST_LINES,
    )

    return (
        <View style={[a.mb_xs, a.w_full, a.flex_col]}>
            <View style={[
                a.flex_row,
                a.align_center,
                a.mb_2xs
            ]}>
                <LockIcon style={[
                    a.mr_xs,
                    t.atoms.text_contrast_medium
                ]} />
                <Text style={[
                    a.text_sm,
                    t.atoms.text_contrast_medium
                ]}>
                    Private post
                </Text>
            </View>

            <RichText
                enableTags
                testID="postText"
                value={richText}
                numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                style={[viewContext === PostEmbedViewContext.ThreadHighlighted ? a.text_lg : a.text_md]}
                shouldProxyLinks={true}
            />
        </View>
    )

}