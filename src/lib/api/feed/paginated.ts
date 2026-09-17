import {type FeedAPI, type FeedAPIResponse} from '#/lib/api/feed/types'

/** Keeps cursor history, not post history, for backward page navigation. */
export class PaginatedFeedAPI implements FeedAPI {
  private api: FeedAPI
  private cursors: (string | undefined)[] = [undefined]
  private lastPage = -1

  constructor(
    private createApi: () => FeedAPI,
    private replay: boolean,
  ) {
    this.api = createApi()
  }

  peekLatest() {
    return this.api.peekLatest()
  }

  async fetch({
    cursor,
    limit,
    signal,
  }: {
    cursor: string | undefined
    limit: number
    signal?: AbortSignal
  }): Promise<FeedAPIResponse> {
    const page = cursor === undefined ? 0 : Number(cursor)
    if (!Number.isInteger(page) || page < 0 || page >= this.cursors.length) {
      throw new Error('Unknown feed page')
    }
    try {
      if (signal?.aborted) throw new Error('Feed pagination cancelled')
      /* Stateful merged feeds cannot seek by server cursor. Replay into a fresh
       * API when going backward, discarding intermediate posts immediately. */
      if (this.replay && page !== this.lastPage + 1) {
        this.api = this.createApi()
        let replayCursor: string | undefined
        for (let index = 0; index < page; index++) {
          const result = await this.api.fetch({cursor: replayCursor, limit})
          if (signal?.aborted) throw new Error('Feed pagination cancelled')
          replayCursor = result.cursor
          if (!replayCursor) throw new Error('Feed page is no longer available')
        }
        this.cursors[page] = replayCursor
      }
      const result = await this.api.fetch({cursor: this.cursors[page], limit})
      this.lastPage = page
      this.cursors.length = page + 1
      if (result.cursor) this.cursors.push(result.cursor)
      return {...result, cursor: result.cursor ? String(page + 1) : undefined}
    } catch (error) {
      this.lastPage = -1
      this.api = this.createApi()
      throw error
    }
  }
}
