import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'

const mockAuth = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: mockAuth },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  // Reset default mock implementations after clearAllMocks
  mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mockAuth.signInWithOtp.mockResolvedValue({ error: null })
  mockAuth.signOut.mockResolvedValue({ error: null })
  mockAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

describe('isAuthenticated', () => {
  it('is false when session is null', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('is true when session is set', () => {
    const store = useAuthStore()
    store.session = { user: { id: 'u1', email: 'a@b.com' } } as never
    expect(store.isAuthenticated).toBe(true)
  })
})

describe('userId / userEmail', () => {
  it('returns null when no user', () => {
    const store = useAuthStore()
    expect(store.userId).toBeNull()
    expect(store.userEmail).toBeNull()
  })

  it('returns user id and email from user object', () => {
    const store = useAuthStore()
    store.user = { id: 'user-123', email: 'test@example.com' } as never
    expect(store.userId).toBe('user-123')
    expect(store.userEmail).toBe('test@example.com')
  })
})

describe('sendMagicLink', () => {
  it('calls signInWithOtp with the email', async () => {
    const store = useAuthStore()
    await store.sendMagicLink('user@example.com')
    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { shouldCreateUser: true },
    })
  })

  it('sets loading to false after success', async () => {
    const store = useAuthStore()
    await store.sendMagicLink('user@example.com')
    expect(store.loading).toBe(false)
  })

  it('throws and resets loading on error', async () => {
    const store = useAuthStore()
    mockAuth.signInWithOtp.mockResolvedValue({ error: { message: 'Rate limited' } })
    await expect(store.sendMagicLink('user@example.com')).rejects.toBeTruthy()
    expect(store.loading).toBe(false)
  })
})

describe('signOut', () => {
  it('clears session and user', async () => {
    const store = useAuthStore()
    store.session = { user: {} } as never
    store.user = { id: 'u1' } as never
    await store.signOut()
    expect(store.session).toBeNull()
    expect(store.user).toBeNull()
  })

  it('sets loading to false after completion', async () => {
    const store = useAuthStore()
    await store.signOut()
    expect(store.loading).toBe(false)
  })
})

describe('initialize', () => {
  it('does not call getSession twice when already initialized', async () => {
    const store = useAuthStore()
    await store.initialize()
    await store.initialize()
    expect(mockAuth.getSession).toHaveBeenCalledTimes(1)
  })

  it('sets session from getSession result', async () => {
    const fakeSession = { user: { id: 'u1', email: 'a@b.com' } }
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession } })
    const store = useAuthStore()
    await store.initialize()
    expect(store.session).toEqual(fakeSession)
    expect(store.user).toEqual(fakeSession.user)
  })
})
