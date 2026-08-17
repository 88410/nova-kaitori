import axios from 'axios'
import { apiGet, apiPost } from './api'

export interface MemberProfile {
  id: number
  username: string
  email: string
  status: string
  created_at: string
  is_admin: boolean
  ai_remaining: number
}

export async function getCurrentMember(): Promise<MemberProfile | null> {
  try {
    return await apiGet<MemberProfile>('/api/v1/members/me')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  const entry = document.cookie.split('; ').find((value) => value.startsWith(prefix))
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null
}

export function getCsrfHeaders(): Record<string, string> {
  const csrfToken = getCookie('nova_csrf')
  return csrfToken ? { 'X-NOVA-CSRF': csrfToken } : {}
}

export async function logoutMember(): Promise<void> {
  await apiPost('/api/v1/members/logout', undefined, {
    headers: getCsrfHeaders(),
  })
}
