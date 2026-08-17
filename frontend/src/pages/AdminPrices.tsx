import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminShell, { dateTime, useAdminAccess } from '../components/AdminShell'
import { apiGet } from '../lib/api'

interface StoreRecord {
  id: number
  name: string
  website_url?: string | null
  product_count: number
  official_catalog_count: number
  official_price_count: number
  sheet_price_count: number
  latest_at?: string | null
}

export default function AdminPrices() {
  const access = useAdminAccess()
  const stores = useQuery({
    queryKey: ['admin-price-stores'],
    queryFn: () => apiGet<{ items: StoreRecord[] }>('/api/v1/admin/price-stores'),
    enabled: access.data?.is_admin === true,
  })

  return (
    <AdminShell title="価格記録">
      <div><p className="text-xs font-semibold tracking-[0.18em] text-violet-600">PRICE DATA</p><h1 className="mt-2 text-2xl font-semibold">店舗一覧</h1><p className="mt-2 text-sm text-slate-500">店舗を選ぶと、商品ごとの公式価格と表データを確認できます。</p></div>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
        {stores.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">価格情報を取得できませんでした。</p>}
        {stores.data?.items.map((store) => (
          <Link key={store.id} to={`/admin/prices/${store.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Store className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{store.name}</h2><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-violet-600" /></div>
                <p className="mt-3 text-xl font-semibold">{store.product_count}<span className="ml-1 text-xs font-normal text-slate-500">機種</span></p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]"><span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">公式 {store.official_price_count}件</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">表 {store.sheet_price_count}件</span></div>
                <p className="mt-1 text-xs text-slate-400">最終更新：{dateTime(store.latest_at)}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AdminShell>
  )
}
