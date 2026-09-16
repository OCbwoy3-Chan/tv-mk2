import {PaginatedFeedAPI} from '#/lib/api/feed/paginated'
import {type FeedAPI} from '#/lib/api/feed/types'
import {type app} from '#/lexicons'

function setup(replay: boolean) {
  const calls: number[] = []
  const createApi = (): FeedAPI => {
    let next = 0
    return {
      peekLatest: jest.fn(),
      fetch: jest.fn(({cursor}) => {
        const page = replay ? next++ : Number(cursor ?? 0)
        calls.push(page)
        return Promise.resolve({
          cursor: page < 3 ? String(page + 1) : undefined,
          feed: [
            {post: {uri: String(page)}} as app.bsky.feed.defs.FeedViewPost,
          ],
        })
      }),
    }
  }
  return {api: new PaginatedFeedAPI(createApi, replay), calls}
}

test.each([false, true])(
  'can revisit pages without retaining post history (replay=%s)',
  async replay => {
    const {api, calls} = setup(replay)
    const load = (cursor?: string) => api.fetch({cursor, limit: 30})
    await load()
    await load('1')
    await load('2')
    const previous = await load('1')
    expect(previous.feed[0].post.uri).toBe('1')
    expect(previous.cursor).toBe('2')
    expect(calls).toEqual(replay ? [0, 1, 2, 0, 1] : [0, 1, 2, 1])
    const next = await load('2')
    expect(next.feed[0].post.uri).toBe('2')
    const last = await load('3')
    expect(last.cursor).toBeUndefined()
    const backFromEnd = await load('2')
    expect(backFromEnd.feed[0].post.uri).toBe('2')
  },
)
