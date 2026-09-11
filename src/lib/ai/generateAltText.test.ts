import {
  cleanGeneratedAltText,
  generateAltText,
  getChatCompletionsUrl,
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
          provider: 'openaiCompatible',
          apiKey: 'api-test',
          baseUrl: 'https://example.com/api/v1',
          model: 'vision-model',
          prompt: 'Describe this.',
        },
        'aW1hZ2U=',
        'image/png',
      ),
    ).resolves.toBe('A black cat on a windowsill.')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer api-test',
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
