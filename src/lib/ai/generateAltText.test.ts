import {
  cleanGeneratedAltText,
  generateAltText,
  getChatCompletionsUrl,
  selectBestCocoreVisionModel,
} from './generateAltText'

describe('cleanGeneratedAltText', () => {
  it('removes model reasoning before a closing think tag', () => {
    expect(
      cleanGeneratedAltText(
        'Drafting a response.\nMore internal reasoning.\n</think>\n\nA yellow emoji face with wide eyes, looking surprised.',
      ),
    ).toBe('A yellow emoji face with wide eyes, looking surprised.')
  })

  it('removes complete reasoning blocks', () => {
    expect(
      cleanGeneratedAltText(
        '<think>I should describe the cat.</think>\nA black cat sits on a windowsill.',
      ),
    ).toBe('A black cat sits on a windowsill.')
  })
})

describe('getChatCompletionsUrl', () => {
  it('appends the OpenAI chat completions path to a base URL', () => {
    expect(getChatCompletionsUrl('https://example.com/v1/')).toBe(
      'https://example.com/v1/chat/completions',
    )
  })

  it('accepts a full chat completions URL', () => {
    expect(
      getChatCompletionsUrl('http://localhost:1234/v1/chat/completions'),
    ).toBe('http://localhost:1234/v1/chat/completions')
  })

  it('rejects non-HTTP URLs', () => {
    expect(() => getChatCompletionsUrl('example.com/v1')).toThrow(
      'must start with http:// or https://',
    )
  })
})

describe('generateAltText', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends an OpenAI-compatible multimodal request', async () => {
    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn()
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{message: {content: 'A black cat on a windowsill. '}}],
        }),
    } as unknown as Response)
    global.fetch = fetchMock

    await expect(
      generateAltText(
        {
          provider: 'cocore',
          apiKey: 'cocore-test',
          baseUrl: 'https://cocore.dev/api/v1',
          model: 'vision-model',
          prompt: 'Describe this.',
        },
        'aW1hZ2U=',
        'image/png',
      ),
    ).resolves.toBe('A black cat on a windowsill.')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cocore.dev/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer cocore-test',
          'Content-Type': 'application/json',
        },
      }),
    )
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(request.body as string)).toMatchObject({
      model: 'vision-model',
      messages: [
        {
          role: 'user',
          content: [
            {type: 'text', text: 'Describe this.'},
            {
              type: 'image_url',
              image_url: {url: 'data:image/png;base64,aW1hZ2U='},
            },
          ],
        },
      ],
    })
  })

  it('automatically mints co/core service auth and selects the best online vision model', async () => {
    const getServiceAuth = jest.fn().mockResolvedValue({
      data: {token: 'service-auth-token'},
    })
    const directAgent = {
      configureProxy: jest.fn(),
      com: {atproto: {server: {getServiceAuth}}},
    }
    const agent = {
      clone: () => directAgent,
    } as never
    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              {modelId: 'text-only', machineCount: 20, vision: false},
              {modelId: 'vision-a', machineCount: 1, vision: true},
              {modelId: 'vision-b', machineCount: 3, vision: true},
            ],
            appviewUnreachable: false,
          }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{message: {content: 'Automatically generated.'}}],
          }),
      } as unknown as Response)
    global.fetch = fetchMock

    await expect(
      generateAltText(
        {provider: 'cocore', baseUrl: 'https://cocore.dev/v1'},
        'aW1hZ2U=',
        'image/jpeg',
        agent,
      ),
    ).resolves.toBe('Automatically generated.')

    expect(getServiceAuth).toHaveBeenCalledWith({
      aud: 'did:web:console.cocore.dev',
      lxm: 'dev.cocore.inference.dispatch',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://cocore.dev/v1/models?view=directory',
    )
    const completionRequest = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(completionRequest.headers).toEqual({
      Authorization: 'Bearer service-auth-token',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(completionRequest.body as string).model).toBe('vision-b')
  })

  it('supports an unauthenticated local API and text-part responses', async () => {
    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn()
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {message: {content: [{type: 'text', text: 'A local result.'}]}},
          ],
        }),
    } as unknown as Response)
    global.fetch = fetchMock

    await expect(
      generateAltText(
        {
          provider: 'openaiCompatible',
          baseUrl: 'http://localhost:11434/v1',
          model: 'local-vision',
        },
        'aW1hZ2U=',
        'image/jpeg',
      ),
    ).resolves.toBe('A local result.')

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(request.headers).toEqual({'Content-Type': 'application/json'})
  })
})

describe('selectBestCocoreVisionModel', () => {
  it('ignores offline and text-only models and uses activity as a tie-breaker', () => {
    expect(
      selectBestCocoreVisionModel([
        {modelId: 'text', machineCount: 10, vision: false},
        {modelId: 'offline', machineCount: 0, vision: true},
        {
          modelId: 'less-used',
          machineCount: 2,
          vision: true,
          activity: {week: {requests: 2}},
        },
        {
          modelId: 'more-used',
          machineCount: 2,
          vision: true,
          activity: {week: {requests: 10}},
        },
      ]),
    ).toBe('more-used')
  })

  it('falls back to co/core directory ranking when vision flags are stale', () => {
    expect(
      selectBestCocoreVisionModel([
        {
          modelId: 'mlx-community/Qwen3.5-4B-MLX-4bit',
          machineCount: 3,
          recommended: true,
          vision: false,
        },
        {
          modelId: 'mlx-community/Qwen3.5-0.8B-MLX-4bit',
          machineCount: 2,
          recommended: true,
          vision: false,
        },
        {modelId: 'stub', machineCount: 9, vision: false},
      ]),
    ).toBe('mlx-community/Qwen3.5-4B-MLX-4bit')
  })
})
