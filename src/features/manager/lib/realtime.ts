import { io, type Socket } from 'socket.io-client'
import { apiOrigin, readTokens } from '@/lib/api'

/** Socket.IO /realtime namespace on the configured backend origin; null when signed out. */
export function connectRealtime(): Socket | null {
  const token = readTokens()?.accessToken
  if (!token) return null
  return io(`${apiOrigin()}/realtime`, { path: '/socket.io', auth: { token } })
}
