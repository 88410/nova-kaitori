import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft, Database, Users } from 'lucide-react'
import { apiGet } from '../lib/api'
import { getCurrentMember } from '../lib/member'

type SourceType = 'all' | 'sheet' | 'official' | 'unknown'

interface CollectionRun {
  id: number
  source_type: 'sheet' | 'official'
  source_name?: string | null
  store_name?: string | null
  status: string
  started_at: string
  finished_at?: string | null
  items_found: number
  prices_saved: number
  error_message?: string | null
}

interface PriceRecord {
  id: number
  product: string
  store: string
  price: number
  scraped_at: string
  source_type: 'sheet' | 'official' | 'unknown'
  source_url?: string | null
}

function dateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(value))
}

export default function AdminDashboard() {
  const [source, setSource] = useState<SourceType>('all')
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember })
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiGet<{ members: number; price_records: number; latest_price_at?: string; latest_runs: CollectionRun[] }>('/api/v1/admin/overview'),
    enabled: member.data?.is_admin === true,
  })
  const prices = useQuery({
    queryKey: ['admin-prices', source],
    queryFn: () => apiGet<{ items: PriceRecord[] }>('/api/v1/admin/prices', {
      params: { limit: 200, ...(source === 'all' ? {} : { source_type: source }) },
    }),
    enabled: member.data?.is_admin === true,
  })
  const runs = useQuery({
    queryKey: ['admin-runs', source],
    queryFn: () => apiGet<{ items: CollectionRun[] }>('/api/v1/admin/collection-runs', {
      params: { limit: 100, ...(source === 'all' ? {} : { source_type: source }) },
    }),
    enabled: member.data?.is_admin === true && source !== 'unknown',
  })

  if (member.isLoading) return <div className="min-h-screen bg-slate-50" />
  if (!member.data?.is_admin) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="text-center"><p className="font-semibold">管理者のみ利用できます。</p><Link to="/" className="mt-4 inline-flex text-sm text-violet-700">トップへ戻る</Link></div></main>
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold tracking-[0.18em] text-violet-600">NOVA ADMIN</p><h1 className="mt-1 text-2xl font-semibold">データ管理</h1></div>
          <Link to="/members/me" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"><ArrowLeft className="h-4 w-4" />マイページ</Link>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: Users, label: '会員数', value: overview.data?.members ?? '—' },
            { Icon: Database, label: '価格記録', value: overview.data?.price_records ?? '—' },
            { Icon: Activity, label: '最終価格取得', value: dateTime(overview.data?.latest_price_at) },
          ].map(({ Icon, label, value }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-5 w-5 text-violet-600" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{String(value)}</p></article>
          ))}
        </section>

        <div className="mt-6 flex gap-2">
          {(['all', 'sheet', 'official', 'unknown'] as SourceType[]).map((item) => <button key={item} onClick={() => setSource(item)} className={`rounded-full px-4 py-2 text-sm ${source === item ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'}`}>{item === 'all' ? 'すべて' : item === 'sheet' ? '表データ' : item === 'official' ? '公式サイト' : '旧記録・不明'}</button>)}
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-4 font-semibold">収集実行記録</h2>
          {source === 'unknown' ? (
            <p className="px-4 py-6 text-sm text-slate-500">旧記録には取得元の実行情報がありません。</p>
          ) : (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">開始時間</th><th className="px-4 py-3">種類</th><th className="px-4 py-3">店舗・取得元</th><th className="px-4 py-3">状態</th><th className="px-4 py-3">取得 / 保存</th></tr></thead><tbody>{runs.data?.items.map((run) => <tr key={run.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-4 py-3">{dateTime(run.started_at)}</td><td className="px-4 py-3">{run.source_type === 'sheet' ? '表' : '公式'}</td><td className="px-4 py-3">{run.store_name || run.source_name || '—'}</td><td className="px-4 py-3">{run.status}{run.error_message ? `：${run.error_message}` : ''}</td><td className="px-4 py-3">{run.items_found} / {run.prices_saved}</td></tr>)}</tbody></table></div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-4 font-semibold">価格記録（最新200件）</h2>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">取得時間</th><th className="px-4 py-3">商品</th><th className="px-4 py-3">店舗</th><th className="px-4 py-3">価格</th><th className="px-4 py-3">取得元</th></tr></thead><tbody>{prices.data?.items.map((price) => <tr key={price.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-4 py-3">{dateTime(price.scraped_at)}</td><td className="px-4 py-3">{price.product}</td><td className="px-4 py-3">{price.store}</td><td className="whitespace-nowrap px-4 py-3 font-medium">¥{price.price.toLocaleString()}</td><td className="px-4 py-3">{price.source_type === 'sheet' ? '表' : price.source_type === 'official' ? '公式' : '不明'}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  )
}
