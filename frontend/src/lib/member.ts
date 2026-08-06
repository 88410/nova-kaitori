import axios from 'axios'
import { apiGet, apiPost } from './api'

export interface MemberProfile {
  id: number
  username: string
  email: string
  status: string
  created_at: string
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

export async function logoutMember(): Promise<void> {
  const csrfToken = getCookie('nova_csrf')
  await apiPost('/api/v1/members/logout', undefined, {
    headers: csrfToken ? { 'X-NOVA-CSRF': csrfToken } : {},
  })
}
