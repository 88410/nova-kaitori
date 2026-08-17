import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LightPage, PageHeader } from './PageChrome'
import { getCurrentMember } from '../lib/member'

export function dateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

export function yen(value?: number | null) {
  return value == null ? '—' : `¥${value.toLocaleString('ja-JP')}`
}

export function useAdminAccess() {
  return useQuery({
    queryKey: ['current-member'],
    queryFn: getCurrentMember,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export default function AdminShell({
  title,
  backTo = '/admin',
  children,
}: {
  title: string
  backTo?: string
  children: ReactNode
}) {
  const member = useAdminAccess()

  if (member.isLoading) {
    return <LightPage><PageHeader title={title} backTo={backTo} /></LightPage>
  }

  if (!member.data?.is_admin) {
    return (
      <LightPage>
        <PageHeader title="管理画面" />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="font-semibold">管理者のみ利用できます。</p>
          <Link to="/" className="mt-4 inline-flex text-sm font-medium text-violet-700">トップへ戻る</Link>
        </main>
      </LightPage>
    )
  }

  return (
    <LightPage>
      <PageHeader title={title} backTo={backTo} />
      <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </LightPage>
  )
}
