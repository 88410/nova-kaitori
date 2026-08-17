import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AdminShell, { dateTime, useAdminAccess, yen } from '../components/AdminShell'
import { apiGet } from '../lib/api'

interface PriceValue {
  price: number
  updated_at: string
  source_url?: string | null
}

interface ProductPrice {
  product_id: number
  product: string
  model: string
  capacity?: string | null
  official?: PriceValue | null
  sheet?: PriceValue | null
}

interface StorePrices {
  store: { id: number; name: string; website_url?: string | null }
  items: ProductPrice[]
}

function PriceBlock({ label, value, official = false }: { label: string; value?: PriceValue | null; official?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${official ? 'bg-violet-50' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${official ? 'text-violet-700' : 'text-slate-500'}`}>{label}</p>
        {value?.source_url && <a href={value.source_url} target="_blank" rel="noreferrer" aria-label={`${label}を開く`} className="text-slate-400 hover:text-violet-700"><ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
      <p className="mt-2 text-xl font-semibold">{yen(value?.price)}</p>
      <p className="mt-1 text-[11px] text-slate-400">更新：{dateTime(value?.updated_at)}</p>
    </div>
  )
}

export default function AdminStorePrices() {
  const { storeId } = useParams()
  const access = useAdminAccess()
  const prices = useQuery({
    queryKey: ['admin-store-prices', storeId],
    queryFn: () => apiGet<StorePrices>(`/api/v1/admin/price-stores/${storeId}`),
    enabled: access.data?.is_admin === true && Boolean(storeId),
  })

  return (
    <AdminShell title={prices.data?.store.name || '店舗価格'} backTo="/admin/prices">
      {prices.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
      {prices.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">価格情報を取得できませんでした。</p>}
      {prices.data && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold tracking-[0.18em] text-violet-600">STORE PRICE</p><h1 className="mt-2 text-2xl font-semibold">{prices.data.store.name}</h1></div>
            <p className="text-sm text-slate-500">{prices.data.items.length}商品</p>
          </div>
          <section className="mt-6 space-y-3">
            {prices.data.items.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">公式・表データに紐づく価格はありません。</p>}
            {prices.data.items.map((item) => (
              <article key={item.product_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-semibold">{item.product}</h2>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <PriceBlock label="公式価格" value={item.official} official />
                  <PriceBlock label="表データ" value={item.sheet} />
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </AdminShell>
  )
}
