import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AdminShell, { dateTime, useAdminAccess, yen } from '../components/AdminShell'
import { apiGet } from '../lib/api'

interface PriceValue {
  price: number
  updated_at: string
  source_url?: string | null
  color_name_ja?: string | null
  is_default_color_price?: boolean
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
  official_price_count: number
  sheet_price_count: number
  items: ProductPrice[]
}

interface OfficialCatalogItem {
  id: number
  source_product_id: number
  product_id: number
  model: string
  capacity: string
  standard_product: string
  product_name: string
  source_jan_code?: string | null
  jan_code: string
  price: number
  source_url?: string | null
  collected_at: string
  mapping_method: string
  mapping_confidence: number
  matcher_version: string
  offer_condition: 'unopened' | 'opened' | 'new' | 'unspecified'
  is_default_color_price: boolean
  variant: {
    id: number
    color_code: string
    color_name_ja: string
    color_name_en: string
    color_name_zh: string
  }
}

interface OfficialCatalog {
  source_product_count: number
  mapped_source_count: number
  standard_variant_count: number
  unmapped_source_count: number
  items: OfficialCatalogItem[]
}

const conditionLabels: Record<OfficialCatalogItem['offer_condition'], string> = {
  unopened: '未開封',
  opened: '開封済',
  new: '新品',
  unspecified: '',
}

function PriceCell({ value, official = false }: { value?: PriceValue | null; official?: boolean }) {
  if (!value) return <span className="text-slate-300">—</span>
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`font-semibold tabular-nums ${official ? 'text-violet-700' : 'text-slate-800'}`}>{yen(value.price)}</span>
        {value.source_url && <a href={value.source_url} target="_blank" rel="noreferrer" aria-label="取得元を開く" className="shrink-0 text-slate-300 hover:text-violet-700"><ExternalLink className="h-3 w-3" /></a>}
      </div>
      {value.color_name_ja && <p className="mt-0.5 truncate text-[10px] text-slate-500">{value.color_name_ja}</p>}
      <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{dateTime(value.updated_at)}</p>
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
  const catalog = useQuery({
    queryKey: ['admin-store-official-catalog', storeId],
    queryFn: () => apiGet<OfficialCatalog>(`/api/v1/admin/price-stores/${storeId}/official-products`),
    enabled: access.data?.is_admin === true && Boolean(storeId),
  })

  return (
    <AdminShell title={prices.data?.store.name || '店舗価格'} backTo="/admin/prices">
      {prices.isLoading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">読み込み中...</p>}
      {prices.isError && <p className="rounded-2xl bg-white p-5 text-sm text-rose-600">価格情報を取得できませんでした。</p>}
      {prices.data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-semibold">{prices.data.store.name}</h1><p className="mt-1 text-xs text-slate-500">{prices.data.items.length}機種</p></div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">公式 {prices.data.official_price_count}件</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">表 {prices.data.sheet_price_count}件</span>
            </div>
          </div>
          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {prices.data.items.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">公式・表データに紐づく価格はありません。</p>}
            {prices.data.items.length > 0 && (
              <table className="w-full table-fixed text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr><th className="w-[42%] px-3 py-2.5">機種</th><th className="w-[29%] px-2 py-2.5">公式</th><th className="w-[29%] px-2 py-2.5">表</th></tr>
                </thead>
                <tbody>
                  {prices.data.items.map((item) => (
                    <tr key={item.product_id} className="border-t border-slate-100 align-top">
                      <td className="break-words px-3 py-2.5 font-medium leading-5 text-slate-900">{item.product}</td>
                      <td className="px-2 py-2.5"><PriceCell value={item.official} official /></td>
                      <td className="px-2 py-2.5"><PriceCell value={item.sheet} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold">
              <span>公式商品明細</span>
              <span className="text-sm font-normal text-slate-500">標準 {catalog.data?.standard_variant_count ?? 0}件</span>
            </summary>
            <div className="border-t border-slate-100">
              {catalog.isLoading && <p className="text-sm text-slate-500">読み込み中...</p>}
              {catalog.isError && <p className="text-sm text-rose-600">公式商品一覧を取得できませんでした。</p>}
              {catalog.data?.items.length === 0 && <p className="text-sm text-slate-500">公式サイトの商品データはまだありません。</p>}
              {catalog.data && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">
                  <span>取得 {catalog.data.source_product_count}件</span>
                  <span>対応済み {catalog.data.mapped_source_count}件</span>
                  <span>カラー別 {catalog.data.standard_variant_count}件</span>
                  <span className={catalog.data.unmapped_source_count > 0 ? 'font-semibold text-rose-600' : 'text-emerald-600'}>未対応 {catalog.data.unmapped_source_count}件</span>
                </div>
              )}
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-[720px] w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2">標準商品 / 取得名</th><th className="px-3 py-2">カラー</th><th className="px-3 py-2">標準JAN</th><th className="px-3 py-2">公式価格</th><th className="px-3 py-2">更新</th></tr></thead>
                  <tbody>
                    {catalog.data?.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 align-top">
                        <td className="max-w-[360px] break-words px-3 py-2">
                          <p className="font-semibold text-slate-900">{item.standard_product}</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{item.product_name}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          <p>{item.variant.color_name_ja}</p>
                          {item.is_default_color_price && <p className="mt-0.5 text-[10px] text-amber-600">全カラー共通価格</p>}
                          {conditionLabels[item.offer_condition] && <p className={`mt-0.5 text-[10px] ${item.offer_condition === 'opened' ? 'text-rose-500' : 'text-slate-400'}`}>{conditionLabels[item.offer_condition]}</p>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-500">{item.jan_code}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-violet-700">{yen(item.price)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-slate-400">{dateTime(item.collected_at)} {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" aria-label="公式商品ページを開く" className="ml-1 inline-block text-slate-400 hover:text-violet-700"><ExternalLink className="h-3 w-3" /></a>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </>
      )}
    </AdminShell>
  )
}
