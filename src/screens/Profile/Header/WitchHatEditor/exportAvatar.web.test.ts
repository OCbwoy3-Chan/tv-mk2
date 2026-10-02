import {exportAvatar} from '#/screens/Profile/Header/WitchHatEditor/exportAvatar.web'

jest.mock('#/view/icons/Logo', () => ({
  LOGO_PATH: 'M0 0L512 512Z',
  LOGO_VIEW_BOX: '0 0 512 512',
}))

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
const drawImage = jest.fn<void, [unknown, ...number[]]>()
const translate = jest.fn<void, [number, number]>()
const rotate = jest.fn<void, [number]>()
const save = jest.fn()
const restore = jest.fn()
const imageSources: string[] = []
const fetchMock = jest.fn()
const toBlob = jest.fn<void, [(blob: {size: number} | null) => void, string]>()
const canvas = {
  width: 0,
  height: 0,
  getContext: () => ({drawImage, translate, rotate, save, restore}),
  toDataURL: jest.fn(() => 'data:image/png;base64,avatar'),
  toBlob,
}
const options = {
  previewRef: {current: null},
  avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:test/blob@jpeg',
  placement: {x: 0.25, y: 0.38, size: 0.5, rotation: 30},
  color: '#123456',
}

beforeEach(() => {
  jest.clearAllMocks()
  imageSources.length = 0
  fetchMock.mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob()),
  })
  toBlob.mockImplementation(callback => callback({size: 500_000}))
  URL.createObjectURL = jest.fn(() => 'blob:avatar')
  URL.revokeObjectURL = jest.fn()
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: fetchMock,
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (tag: string) => {
        if (tag === 'canvas') return canvas
        const image = {
          naturalWidth: 800,
          naturalHeight: 600,
          onload: () => {},
          set src(value: string) {
            imageSources.push(value)
            this.onload()
          },
        }
        return image
      },
    },
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'fetch', originalFetch!)
  if (originalDocument)
    Object.defineProperty(globalThis, 'document', originalDocument)
  else Reflect.deleteProperty(globalThis, 'document')
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

it('center-crops the photo, composites the colored SVG at the preview position, and exports PNG', async () => {
  const result = await exportAvatar(options)
  expect(fetchMock).toHaveBeenCalledWith(
    'https://bsky.social/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Atest&cid=blob',
  )
  expect(imageSources[0]).toBe('blob:avatar')
  expect(decodeURIComponent(imageSources[1])).toContain('fill="#123456"')
  expect(drawImage.mock.calls[0].slice(1)).toEqual([
    100, 0, 600, 600, 0, 0, 1000, 1000,
  ])
  expect(drawImage.mock.calls[1].slice(1)).toEqual([-250, -250, 500, 500])
  expect(result).toEqual({
    path: 'data:image/png;base64,avatar',
    width: 1000,
    height: 1000,
    mime: 'image/png',
  })
  expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
  expect(translate).toHaveBeenCalledWith(250, 380)
  expect(rotate).toHaveBeenCalledWith(Math.PI / 6)
  expect(save).toHaveBeenCalledTimes(1)
  expect(restore).toHaveBeenCalledTimes(1)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar')
})

it('reduces PNG dimensions to respect the avatar upload limit', async () => {
  toBlob.mockImplementationOnce(callback => callback({size: 1_100_000}))
  const result = await exportAvatar(options)
  expect(result.width).toBe(800)
  expect(result.height).toBe(800)
  expect(drawImage.mock.calls[3].slice(1)).toEqual([-200, -200, 400, 400])
})

it('surfaces download errors without creating a temporary URL', async () => {
  fetchMock.mockResolvedValue({ok: false, status: 403})
  await expect(exportAvatar(options)).rejects.toThrow(
    'Image download failed: 403',
  )
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

it('releases the temporary URL when PNG encoding fails', async () => {
  toBlob.mockImplementation(callback => callback(null))
  await expect(exportAvatar(options)).rejects.toThrow('Could not export avatar')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar')
})
