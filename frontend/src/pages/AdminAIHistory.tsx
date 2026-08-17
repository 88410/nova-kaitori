import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminShell, { dateTime, useAdminAccess } from '../components/AdminShell'
import { apiGet } from '../lib/api'

type Actor = 'all' | 'member' | 'guest'

interface AIRecord {
  id: number
  member_id?: number | null
  username?: string | null
  email?: string | null
  ip_address?: string | null
  question: string
  answer: string
  language?: string | null
  created_at: string
}

export default function AdminAIHistory() {
  const [actor, setActor] = useState<Actor>('all')
  const access = useAdminAccess()
  const history = useQuery({
    queryKey: ['admin-ai-history', actor],
    queryFn: () => apiGet<{ items: AIRecord[]; total: number }>('/api/v1/admin/ai-history', { params: { actor, limit: 100 } }),
    enabled: access.data?.is_admin === true,
  })

  return (
    <AdminShell title="AI記録">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[0.18em] text-violet-600">AI HISTORY</p><h1 className="mt-2 text-2xl font-semibold">質問・回答履歴</h1></div>
        <p className="text-sm text-slate-500">{history.data ? `${history.data.total}件` : '—'}</p>
      </div>
      <div className="mt-5 flex gap-2">
        {([['all', 'すべて'], ['member', '会員'], ['guest', '訪問者']] as [Actor, string][]).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setActor(value)} className={`rounded-full px-4 py-2 text-sm ${actor === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button>
        ))}
      </div>

      <section className="mt-5 space-y-3">
        {history.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
        {history.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">AI記録を取得できませんでした。</p>}
        {history.data?.items.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">AI記録はありません。</p>}
        {history.data?.items.map((record) => (
          <details key={record.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-violet-700">{record.member_id ? record.username || '会員' : '訪問者'}</p><p className="mt-2 break-words font-medium leading-6">{record.question}</p></div>
                <time className="shrink-0 text-xs text-slate-400">{dateTime(record.created_at)}</time>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>IP：{record.ip_address || '記録なし'}</span>{record.email && <span>{record.email}</span>}{record.language && <span>{record.language}</span>}</div>
            </summary>
            <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-400">NOVA AI</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{record.answer}</p></div>
          </details>
        ))}
      </section>
    </AdminShell>
  )
}
