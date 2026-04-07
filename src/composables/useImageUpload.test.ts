import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useImageUpload } from './useImageUpload'

const mockUploadImage = vi.hoisted(() => vi.fn())
const mockGetImageUrl = vi.hoisted(() => vi.fn().mockReturnValue('https://example.com/img.jpg'))

vi.mock('@/stores/recipe.store', () => ({
  useRecipeStore: () => ({
    uploadImage: mockUploadImage,
    getImageUrl: mockGetImageUrl,
  }),
}))

// useImageUpload imports recipe.store which imports supabase — stub it out
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
    auth: { getSession: vi.fn() },
  },
}))

function makeFile(name = 'photo.jpg', type = 'image/jpeg', sizeBytes = 1024): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], name, { type })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockGetImageUrl.mockReturnValue('https://example.com/img.jpg')
})

describe('uploadImage validation', () => {
  it('throws when file is not an image', async () => {
    const { uploadImage } = useImageUpload('plan-1')
    const file = makeFile('doc.pdf', 'application/pdf')
    await expect(uploadImage(file)).rejects.toThrow('File must be an image')
  })

  it('throws when file exceeds 10MB', async () => {
    const { uploadImage } = useImageUpload('plan-1')
    const tenMbPlusOne = 10 * 1024 * 1024 + 1
    const file = makeFile('big.jpg', 'image/jpeg', tenMbPlusOne)
    await expect(uploadImage(file)).rejects.toThrow('Image must be smaller than 10MB')
  })

  it('accepts a valid image file under 10MB', async () => {
    mockUploadImage.mockResolvedValue('plan-1/123.jpg')
    const { uploadImage } = useImageUpload('plan-1')
    const file = makeFile('photo.jpg', 'image/jpeg', 500 * 1024)
    const path = await uploadImage(file)
    expect(path).toBe('plan-1/123.jpg')
  })
})

describe('uploading state', () => {
  it('is false initially', () => {
    const { uploading } = useImageUpload('plan-1')
    expect(uploading.value).toBe(false)
  })

  it('is false after a validation error (never became true)', async () => {
    const { uploading, uploadImage } = useImageUpload('plan-1')
    const file = makeFile('doc.pdf', 'application/pdf')
    await expect(uploadImage(file)).rejects.toThrow()
    expect(uploading.value).toBe(false)
  })

  it('resets to false after successful upload', async () => {
    mockUploadImage.mockResolvedValue('plan-1/abc.jpg')
    const { uploading, uploadImage } = useImageUpload('plan-1')
    await uploadImage(makeFile())
    expect(uploading.value).toBe(false)
  })

  it('resets to false and sets error on upload failure', async () => {
    mockUploadImage.mockRejectedValue(new Error('Storage error'))
    const { uploading, error, uploadImage } = useImageUpload('plan-1')
    await expect(uploadImage(makeFile())).rejects.toThrow('Storage error')
    expect(uploading.value).toBe(false)
    expect(error.value).toBe('Storage error')
  })
})

describe('getImageUrl', () => {
  it('delegates to recipeStore.getImageUrl', () => {
    const { getImageUrl } = useImageUpload('plan-1')
    const url = getImageUrl('plan-1/img.jpg')
    expect(mockGetImageUrl).toHaveBeenCalledWith('plan-1/img.jpg')
    expect(url).toBe('https://example.com/img.jpg')
  })
})
