/** Adapted from eurosky-social/eurosky-social-app (MIT). */
import {
  DECORATION_LIST_URI,
  getDecorationSettings,
  hasDecorationEntitlement,
  parseDecorationSettings,
} from './records'

const PROD_LIST =
  'at://did:plc:issuer/app.bsky.graph.list/production-subscribers'
const TEST_LIST = 'at://did:plc:issuer/app.bsky.graph.list/test-subscribers'
const SUBJECT = 'did:plc:subscriber'
const originalFetch = global.fetch

describe('hasDecorationEntitlement', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('checks multiple accepted lists in one many-to-many request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              linkRecord: {
                did: 'did:plc:issuer',
                collection: 'app.bsky.graph.listitem',
                rkey: 'manual-tid',
              },
              otherSubject: TEST_LIST,
            },
          ],
        }),
    } as Response)

    await expect(
      hasDecorationEntitlement(SUBJECT, [PROD_LIST, TEST_LIST]),
    ).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/xrpc/blue.microcosm.links.getManyToMany')
    expect(url.searchParams.get('subject')).toBe(SUBJECT)
    expect(url.searchParams.get('source')).toBe(
      'app.bsky.graph.listitem:subject',
    )
    expect(url.searchParams.get('pathToOther')).toBe('list')
    expect(url.searchParams.getAll('otherSubject')).toEqual([
      PROD_LIST,
      TEST_LIST,
    ])
    expect(url.searchParams.getAll('did')).toEqual(['did:plc:issuer'])
  })

  it('rejects a result whose record owner does not own the matched list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              linkRecord: {
                did: 'did:plc:someone-else',
                collection: 'app.bsky.graph.listitem',
                rkey: 'spoofed',
              },
              otherSubject: PROD_LIST,
            },
          ],
        }),
    } as Response)

    await expect(hasDecorationEntitlement(SUBJECT, [PROD_LIST])).resolves.toBe(
      false,
    )
  })

  it('does not query when no valid list URI is configured', async () => {
    await expect(
      hasDecorationEntitlement(SUBJECT, ['not-an-at-uri']),
    ).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('decoration record reads', () => {
  const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn()
  function response(body: unknown, status = 200): Response {
    return {
      ok: status === 200,
      status,
      json: () => Promise.resolve(body),
    } as Response
  }
  beforeEach(() => {
    global.fetch = fetchMock
  })
  afterEach(() => {
    global.fetch = originalFetch
    fetchMock.mockReset()
  })
  it('uses the configured Vessel list and its owner by default', async () => {
    fetchMock.mockResolvedValue(response({items: []}))
    await hasDecorationEntitlement(SUBJECT)
    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.getAll('otherSubject')).toEqual([
      DECORATION_LIST_URI,
    ])
    expect(url.searchParams.getAll('did')).toEqual([
      'did:web:vessel.darkworld.download',
    ])
  })
  it('does not grant access for a different list owned by the same DID', async () => {
    fetchMock.mockResolvedValue(
      response({
        items: [
          {
            linkRecord: {
              did: 'did:web:vessel.darkworld.download',
              collection: 'app.bsky.graph.listitem',
              rkey: 'item',
            },
            otherSubject:
              'at://did:web:vessel.darkworld.download/app.bsky.graph.list/unrelated',
          },
        ],
      }),
    )
    await expect(hasDecorationEntitlement(SUBJECT)).resolves.toBe(false)
  })
  it('reads all slots from the selected Slingshot instance', async () => {
    fetchMock.mockResolvedValue(
      response({
        value: {avatar: 'gold-ring', name: 'rainbow', nameOutline: true},
      }),
    )
    await expect(
      getDecorationSettings(SUBJECT, 'https://records.example'),
    ).resolves.toEqual({
      avatar: 'gold-ring',
      name: 'rainbow',
      nameOutline: true,
    })
    expect(new URL(fetchMock.mock.calls[0][0] as string).origin).toBe(
      'https://records.example',
    )
  })
  it('ignores malformed slot values', async () => {
    fetchMock.mockResolvedValue(
      response({value: {avatar: {}, name: 12, nameOutline: 'true'}}),
    )
    await expect(getDecorationSettings(SUBJECT)).resolves.toEqual({
      avatar: undefined,
      name: undefined,
      nameOutline: false,
    })
  })
  it('treats a missing settings record as no choices', async () => {
    fetchMock.mockResolvedValue(response({error: 'RecordNotFound'}, 400))
    await expect(getDecorationSettings(SUBJECT)).resolves.toEqual({})
  })
  it('surfaces other read failures instead of returning empty choices', async () => {
    fetchMock.mockResolvedValue(response({error: 'InvalidRequest'}, 400))
    await expect(getDecorationSettings(SUBJECT)).rejects.toThrow(
      'Slingshot getRecord failed: 400',
    )
  })
})

describe('profile picture shapes', () => {
  it.each(['circle', 'square', 'squircle', 'hexagon'] as const)(
    'accepts the %s shape',
    shape => {
      expect(parseDecorationSettings({avatarShape: shape}).avatarShape).toBe(
        shape,
      )
    },
  )

  it('ignores unknown shapes', () => {
    expect(
      parseDecorationSettings({avatarShape: 'triangle'}).avatarShape,
    ).toBeUndefined()
  })
})
