import axios, { type AxiosRequestConfig } from 'axios'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function apiGet<T>(path: string, config: AxiosRequestConfig = {}) {
  const params = {
    ...(config.params ?? {}),
    _t: Date.now(),
  }

  const response = await axios.get<T>(`${API_URL}${path}`, {
    ...config,
    withCredentials: true,
    params,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ...(config.headers ?? {}),
    },
  })

  return response.data
}

export async function apiPost<T>(path: string, data?: unknown, config: AxiosRequestConfig = {}) {
  const response = await axios.post<T>(`${API_URL}${path}`, data, {
    ...config,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers ?? {}),
    },
  })

  return response.data
}
