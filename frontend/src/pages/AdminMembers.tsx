import { useQuery } from '@tanstack/react-query'
import { ChevronRight, CircleUserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminShell, { dateTime, useAdminAccess } from '../components/AdminShell'
import { apiGet } from '../lib/api'

interface MemberRecord {
  id: number
  username: string
  email: string
  status: string
  created_at: string
  last_login_at?: string | null
  login_count: number
  ai_used: number
  ai_remaining: number
}

export default function AdminMembers() {
  const access = useAdminAccess()
  const members = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => apiGet<{ items: MemberRecord[]; total: number }>('/api/v1/admin/members'),
    enabled: access.data?.is_admin === true,
  })

  return (
    <AdminShell title="会員管理">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[0.18em] text-violet-600">MEMBERS</p><h1 className="mt-2 text-2xl font-semibold">会員一覧</h1></div>
        <p className="text-sm text-slate-500">{members.data ? `${members.data.total}人` : '—'}</p>
      </div>

      <section className="mt-6 space-y-3">
        {members.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
        {members.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">会員情報を取得できませんでした。</p>}
        {members.data?.items.map((member) => (
          <Link key={member.id} to={`/admin/members/${member.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><CircleUserRound className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-semibold">{member.username}</p><p className="mt-0.5 truncate text-sm text-slate-500">{member.email}</p></div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-violet-600" />
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-4">
                  <p>登録：<span className="text-slate-700">{dateTime(member.created_at)}</span></p>
                  <p>最終ログイン：<span className="text-slate-700">{dateTime(member.last_login_at)}</span></p>
                  <p>ログイン：<span className="text-slate-700">{member.login_count}回</span></p>
                  <p>AI：<span className="text-slate-700">{member.ai_used} / 100回</span></p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AdminShell>
  )
}
