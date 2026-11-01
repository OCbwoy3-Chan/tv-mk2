import { View } from 'react-native'
import { Trans, useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { STALE } from '#/state/queries'
import { type FeedSourceFeedInfo } from '#/state/queries/feed'
import { createQueryKey } from '#/state/queries/util'
import { usePdsClient, useSession } from '#/state/session'
import { atoms as a, useTheme } from '#/alf'
import { Button, ButtonText } from '#/components/Button'
import { Divider } from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import { Loader } from '#/components/Loader'
import * as Toast from '#/components/Toast'
import { Text } from '#/components/Typography'
import { party } from '#/lexicons'
import { isOfficialTennaFeed, readPreference, writePreference } from './records'

const useTennaFeedPreferenceQuery = 'useTennaFeedPreferenceQuery'

export function TennaFeedSettings({ info }: { info: FeedSourceFeedInfo }) {
	const { hasSession } = useSession()
	if (!hasSession || !isOfficialTennaFeed(info.uri, info.view?.did)) return null
	return <Settings uri={info.uri} />
}

function Settings({ uri }: { uri: string }) {
	const t = useTheme()
	const { t: l } = useLingui()
	const client = usePdsClient()
	const queryClient = useQueryClient()
	const queryKey = createQueryKey(useTennaFeedPreferenceQuery, {
		did: client.assertDid,
		uri,
	})
	const query = useQuery({
		queryKey,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async () => {
			const result = await readPreference(client, uri)
			if (!result) return null
			return party.tenna.feed.preference.$parse(result.value)
		},
	})
	const mutation = useMutation({
		mutationFn: (patch: Partial<Pick<party.tenna.feed.preference.Main, 'optOut' | 'showMarkedPosts'>>) => writePreference(client, uri, patch),
		onSuccess: record => {
			queryClient.setQueryData(queryKey, record)
			Toast.show(l`Preferences saved successfully!`)
		},
		onError: () =>
			Toast.show(l`Could not save feed settings. Please try again.`, {
				type: 'error',
			}),
	})

	return (
		<View style={[a.gap_md]} testID="tennaFeedSettings">
			{!query.isPending && <Divider />}
			{query.isPending ? (
				<Loader />
			) : query.isError ? (
				<>
					<Text>
						<Trans>Could not load feed settings.</Trans>
					</Text>
					<Button
						label={l`Retry loading feed settings`}
						color="secondary"
						size="small"
						onPress={() => void query.refetch()}>
						<ButtonText>
							<Trans>Retry</Trans>
						</ButtonText>
					</Button>
				</>
			) : (
				<>
					<Toggle.Item
						name="tennaFeedOptOut"
						testID="tennaFeedOptOut"
						label={l`Opt out of this feed`}
						value={query.data?.optOut === true}
						disabled={mutation.isPending}
						onChange={value => mutation.mutate({optOut: value})}
						style={[a.flex_row, a.align_center, a.justify_between, a.py_sm]}>
						<Toggle.LabelText style={[a.text_md]}>
							<Trans>Opt out of this feed</Trans>
						</Toggle.LabelText>
						<Toggle.Switch />
					</Toggle.Item>
					<Toggle.Item
						name="tennaFeedUnhideNsfw"
						testID="tennaFeedUnhideNsfw"
						label={l`Show MDNI posts`}
						value={query.data?.showMarkedPosts === true}
						disabled={mutation.isPending}
						onChange={value => mutation.mutate({showMarkedPosts: value})}
						style={[a.flex_row, a.align_center, a.justify_between, a.py_sm]}>
						<Toggle.LabelText style={[a.text_md]}>
							<Trans>Show MDNI posts</Trans>
						</Toggle.LabelText>
						<Toggle.Switch />
					</Toggle.Item>
				</>
			)}
		</View>
	)
}
