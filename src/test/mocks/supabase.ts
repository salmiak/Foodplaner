import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query builder mock.
 * Any method call returns the same chain (for fluent API), and
 * the chain is also thenable so it can be awaited directly.
 */
export function createChain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain: Record<string, unknown> = {}

  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop === 'then') return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      if (prop === 'catch') return (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)
      if (prop === 'finally') return (fn: () => void) => Promise.resolve(result).finally(fn)
      // Any method call returns the same proxy (chainable)
      return vi.fn().mockReturnValue(proxy)
    },
  }

  const proxy = new Proxy(chain, handler)
  return proxy
}

export const mockFrom = vi.fn()

export const mockAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}

export const mockStorageBucket = {
  upload: vi.fn().mockResolvedValue({ data: null, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
}

export const mockStorage = {
  from: vi.fn().mockReturnValue(mockStorageBucket),
}

export const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
}

export const mockSupabase = {
  from: mockFrom,
  auth: mockAuth,
  storage: mockStorage,
  channel: vi.fn().mockReturnValue(mockChannel),
}
