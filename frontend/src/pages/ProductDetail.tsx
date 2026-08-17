import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { apiGet } from '../lib/api'
import { useI18n } from '../i18n'
import ProfessionalKLineChart from '../components/ProfessionalKLineChart'
import { LightPage, PageHeader, lightPanelClass } from '../components/PageChrome'

interface Product {
  id: number
  name: string
  model: string
  capacity: string
  color: string
  carrier: string
  image_url: string | null
  retail_price: number | null
}

interface Store {
  id: number
  name: string
}

interface PriceWithStore {
  id: number
  price: number
  price_change: number
  price_change_percent: number
  is_best_price: number
  scraped_at: string
  store: Store
  product?: Product
  profit: number | null
  profit_percent: number | null
}

interface MarketSummary {
  accepted_prices: Array<{
    store_id: number
    price: number
  }>
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`
}

function formatSignedPrice(price: number): string {
  const sign = price > 0 ? '+' : price < 0 ? '-' : ''
  return `${sign}¥${Math.abs(price).toLocaleString()}`
}

function formatChange(priceChange: number, percentChange: number): string {
  if (priceChange === 0) return '-'
  const sign = priceChange > 0 ? '+' : '-'
  return `${sign}¥${Math.abs(priceChange).toLocaleString()} (${Math.abs(percentChange)}%)`
}

export default function ProductDetail() {
  const { language, t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { data: prices } = useQuery<PriceWithStore[]>({
    queryKey: ['product-prices', productId],
    queryFn: async () => {
      const [rawPrices, market] = await Promise.all([
        apiGet<PriceWithStore[]>(`/api/v1/prices/latest/${productId}`),
        apiGet<MarketSummary>(`/api/v1/prices/market-average/${productId}`),
      ])
      const accepted = new Set(market.accepted_prices.map((price) => `${price.store_id}:${price.price}`))
      return rawPrices.filter((price) => accepted.has(`${price.store.id}:${price.price}`))
    },
  })

  const bestPrice = prices?.[0]
  const product = bestPrice?.product

  return (
    <LightPage>
      <PageHeader title={product?.model ?? t('priceDetails')} backTo="/prices" />

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
        {product && bestPrice && (
          <>
            <section className={`mb-4 overflow-hidden p-5 sm:mb-6 sm:p-8 ${lightPanelClass}`}>
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-cyan-50 text-3xl sm:h-24 sm:w-24 sm:text-4xl">
                    <span aria-hidden="true">📱</span>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full bg-white object-contain p-2"
                        onError={(event) => event.currentTarget.remove()}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-violet-600">NOVA PRICE DATA</p>
                    <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{product.model}</h1>
                    <p className="mt-1 break-words text-sm text-slate-600 sm:text-base">
                      {product.capacity}
                      {t('conditionSeparator')}
                      {product.color}
                      {t('conditionSeparator')}
                      {product.carrier}
                    </p>
                    {product.retail_price && (
                      <p className="mt-2 text-sm text-slate-500">
                        {t('newRetailPrice')}: ¥{product.retail_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-left md:min-w-64 md:text-right">
                  <p className="text-xs font-semibold tracking-wide text-emerald-700">{t('bestBuybackPrice')}</p>
                  <p className="mt-2 break-words text-3xl font-semibold tracking-tight text-emerald-700 sm:text-4xl">¥{bestPrice.price.toLocaleString()}</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-600">{bestPrice.store.name}</p>
                  {bestPrice.profit !== null && bestPrice.profit > 0 && (
                    <p className="mt-1 text-sm text-emerald-700">
                      {t('profit')} ¥{bestPrice.profit.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className={`mb-4 overflow-hidden sm:mb-6 ${lightPanelClass}`}>
              <div className="border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">{t('byStorePrices')}</h2>
              </div>

              <div className="grid gap-3 p-3 sm:hidden">
                {prices?.map((price) => {
                  const profit = price.profit ?? (product.retail_price !== null ? price.price - product.retail_price : null)
                  const changeClass = price.price_change > 0 ? 'text-emerald-600' : price.price_change < 0 ? 'text-rose-600' : 'text-slate-500'

                  return (
                    <article key={price.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-950">{price.store.name}</h3>
                            {price.is_best_price === 1 && (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {t('bestPriceBadge')}
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-xs font-medium ${changeClass}`}>{formatChange(price.price_change, price.price_change_percent)}</p>
                        </div>
                        <p className="shrink-0 text-xl font-semibold tracking-tight text-slate-950">{formatPrice(price.price)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                        <span className="text-slate-500">{t('profit')}</span>
                        <span className={`font-semibold ${profit === null ? 'text-slate-500' : profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {profit === null ? '-' : formatSignedPrice(profit)}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto px-5 py-4 sm:block sm:px-7">
                <table className="min-w-full table-auto text-left">
                  <thead className="bg-white">
                    <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">{t('store')}</th>
                      <th className="px-3 py-3">{t('buybackPrice')}</th>
                      <th className="px-3 py-3">{t('retailPrice')}</th>
                      <th className="px-3 py-3">{t('profit')}</th>
                      <th className="px-3 py-3">{t('change')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices?.map((price) => {
                      const profit =
                        price.profit ?? (product.retail_price !== null ? price.price - product.retail_price : null)
                      const changeClass =
                        price.price_change > 0
                          ? 'text-emerald-600'
                          : price.price_change < 0
                            ? 'text-red-600'
                            : 'text-slate-500'

                      return (
                        <tr key={price.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-900">{price.store.name}</span>
                              {price.is_best_price === 1 && (
                                <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  {t('bestPriceBadge')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{formatPrice(price.price)}</td>
                          <td className="px-3 py-3">
                            {product.retail_price !== null ? formatPrice(product.retail_price) : '-'}
                          </td>
                          <td
                            className={`px-3 py-3 font-medium ${
                              profit === null ? 'text-slate-500' : profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {profit === null ? '-' : formatSignedPrice(profit)}
                          </td>
                          <td className={`px-3 py-3 font-medium ${changeClass}`}>
                            {formatChange(price.price_change, price.price_change_percent)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {prices && prices.length > 0 && (
              <section className={`p-3 sm:p-7 ${lightPanelClass}`}>
                <div className="mb-4 flex items-center gap-2 px-2 sm:mb-6 sm:px-0">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">{t('priceTrend')}</h2>
                </div>
                <ProfessionalKLineChart productId={productId} language={language} />
              </section>
            )}
          </>
        )}
      </main>
    </LightPage>
  )
}
