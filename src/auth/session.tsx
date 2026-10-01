import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, clearTokens, get, post, readTokens, saveTokens } from '../lib/api'
import type { Tokens, User } from '../lib/types'
import { SessionContext } from './session-context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient()
  const [state, setState] = useState<'loading' | 'anonymous' | 'authenticated' | 'unavailable'>(
    readTokens() ? 'loading' : 'anonymous',
  )
  const [user, setUser] = useState<User | null>(null)
  const verify = useCallback(async () => {
    if (!readTokens()) {
      setUser(null)
      setState('anonymous')
      return
    }
    setState('loading')
    try {
      const profile = await get<User>('/users/profile/me')
      setUser(profile)
      setState('authenticated')
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearTokens()
        cache.clear()
        setUser(null)
        setState('anonymous')
      } else setState('unavailable')
    }
  }, [cache])
  useEffect(() => {
    queueMicrotask(() => void verify())
  }, [verify])
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === 'sportscenter.member.tokens') {
        cache.clear()
        void verify()
      }
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [verify, cache])
  const accept = useCallback(
    (value: { user: User } & Tokens) => {
      cache.clear()
      saveTokens(value)
      setUser(value.user)
      setState('authenticated')
    },
    [cache],
  )
  const logout = useCallback(async () => {
    try {
      if (readTokens()) await post('/auth/logout', {})
    } catch {
      /* Clear local credentials even if the network is unavailable. */
    }
    clearTokens()
    cache.clear()
    setUser(null)
    setState('anonymous')
  }, [cache])
  const context = useMemo(
    () => ({ state, user, accept, verify, logout }),
    [state, user, accept, verify, logout],
  )
  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>
}
