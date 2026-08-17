import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import AdminShell, { dateTime, useAdminAccess } from '../components/AdminShell'
import { apiGet } from '../lib/api'

interface LoginRecord {
  id: string
  event_type: 'register' | 'login' | 'legacy_session'
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

interface MemberDetail {
  member: { id: number; username: string; email: string; status: string; created_at: string }
  items: LoginRecord[]
}

export default function AdminMemberDetail() {
  const { memberId } = useParams()
  const access = useAdminAccess()
  const detail = useQuery({
    queryKey: ['admin-member-logins', memberId],
    queryFn: () => apiGet<MemberDetail>(`/api/v1/admin/members/${memberId}/logins`),
    enabled: access.data?.is_admin === true && Boolean(memberId),
  })

  return (
    <AdminShell title="会員詳細" backTo="/admin/members">
      {detail.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
      {detail.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">会員情報を取得できませんでした。</p>}
      {detail.data && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-600">MEMBER</p>
            <h1 className="mt-2 text-2xl font-semibold">{detail.data.member.username}</h1>
            <p className="mt-1 break-all text-sm text-slate-500">{detail.data.member.email}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <p>状態：{detail.data.member.status}</p>
              <p>登録：{dateTime(detail.data.member.created_at)}</p>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between"><h2 className="font-semibold">ログイン記録</h2><p className="text-xs text-slate-500">{detail.data.items.length}件</p></div>
            <div className="mt-3 space-y-3">
              {detail.data.items.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">ログイン記録はありません。</p>}
              {detail.data.items.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{record.event_type === 'register' ? '会員登録' : record.event_type === 'login' ? 'ログイン' : '過去のログインセッション'}</p>
                    <time className="text-xs text-slate-500">{dateTime(record.created_at)}</time>
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-600">IP：{record.ip_address || '記録なし'}</p>
                  {record.user_agent && <p className="mt-1 break-all text-xs leading-5 text-slate-400">{record.user_agent}</p>}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  )
}
