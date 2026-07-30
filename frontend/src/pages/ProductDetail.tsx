import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { apiGet } from '../lib/api'
import { useI18n } from '../i18n'
import ProfessionalKLineChart from '../components/ProfessionalKLineChart'

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
      return apiGet<PriceWithStore[]>(`/api/v1/prices/latest/${productId}`)
    },
  })

  const bestPrice = prices?.[0]
  const product = bestPrice?.product

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/prices"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            {t('back')}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {product && bestPrice && (
          <>
            <div className="mb-8 rounded-xl bg-white p-4 shadow-lg sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-3xl sm:h-24 sm:w-24 sm:text-4xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                    ) : '📱'}
                  </div>
                  <div className="min-w-0">
                    <h1 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">{product.model}</h1>
                    <p className="mt-1 break-words text-sm text-gray-600 sm:text-lg">
                      {product.capacity}
                      {t('conditionSeparator')}
                      {product.color}
                      {t('conditionSeparator')}
                      {product.carrier}
                    </p>
                    {product.retail_price && (
                      <p className="text-gray-500 mt-2">
                        {t('newRetailPrice')}: ¥{product.retail_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left md:text-right">
                  <p className="text-sm text-gray-500">{t('bestBuybackPrice')}</p>
                  <p className="mt-1 break-words text-3xl font-bold text-green-600 sm:text-4xl">¥{bestPrice.price.toLocaleString()}</p>
                  <p className="mt-1 break-words text-sm text-gray-500">{bestPrice.store.name}</p>
                  {bestPrice.profit !== null && bestPrice.profit > 0 && (
                    <p className="text-green-600 mt-1">
                      {t('profit')} ¥{bestPrice.profit.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">{t('byStorePrices')}</h2>
              </div>

              <div className="overflow-x-auto px-4 py-4 sm:px-6">
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
            </div>

            {prices && prices.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">{t('priceTrend')}</h2>
              </div>
              <ProfessionalKLineChart productId={productId} language={language} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
