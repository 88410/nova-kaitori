import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { apiGet } from '../lib/api'
import { useI18n } from '../i18n'
// import MiniKLine from './MiniKLine'

interface Store {
  id: number
  name: string
  website_url?: string | null
  address?: string | null
  phone?: string | null
  summary?: string | null
  is_sponsored?: boolean
}

interface Product {
  id: number
  name: string
  model: string
  capacity: string
  retail_price: number | null
}

interface Price {
  id: number
  price: number
  price_change: number
  price_change_percent: number
  scraped_at: string | null
  store: Store
  product: Product
  profit: number | null
}

interface GroupedProduct {
  product: Product
  prices: Price[]
}

interface ModelSectionGroup {
  title: string
  family: string
  items: GroupedProduct[]
}

interface FxResponse {
  rates: typeof DEFAULT_FX_RATES
  last_updated?: string | null
}

interface StatsResponse {
  last_updated?: string | null
}

const CAPACITY_ORDER: Record<string, number> = {
  '128GB': 1,
  '128': 1,
  '256GB': 2,
  '256': 2,
  '512GB': 3,
  '512': 3,
  '1TB': 4,
  '1T': 4,
  '1024': 4,
  '1024GB': 4,
  '2TB': 5,
  '2T': 5,
  '2048': 5,
  '2048GB': 5,
}

const DEFAULT_FX_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺' },
} as const

const MODEL_VARIANT_PRIORITY = ['Pro Max', 'Pro', 'Plus', 'Air', 'mini', 'e'] as const

function getCapacityOrder(capacity: string): number {
  const normalized = capacity?.toUpperCase().replace(/\s/g, '') || ''
  return CAPACITY_ORDER[normalized] || CAPACITY_ORDER[capacity] || 99
}

function formatCapacity(capacity: string): string {
  if (!capacity) return '-'
  if (/^\d+$/.test(capacity)) return `${capacity}GB`
  return capacity
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

function formatFxPrice(price: number, rate: number, symbol: string): string {
  return `${symbol}${(price / rate).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

function getProfit(price: number, retailPrice: number | null): number | null {
  if (retailPrice === null) return null
  return price - retailPrice
}

function getModelFamily(model: string): string {
  const match = model.match(/iPhone\s*(\d+)/i)
  return match ? `iPhone ${match[1]}` : 'Other'
}

function getFamilyNumber(family: string): number {
  const match = family.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function getModelPriority(model: string): number {
  const normalized = model.toLowerCase()

  for (const [index, variant] of MODEL_VARIANT_PRIORITY.entries()) {
    if (normalized.includes(variant.toLowerCase())) {
      return index
    }
  }

  return MODEL_VARIANT_PRIORITY.length
}

function sortModelTitles(a: string, b: string): number {
  const familyDiff = getFamilyNumber(b) - getFamilyNumber(a)
  if (familyDiff !== 0) return familyDiff

  const variantDiff = getModelPriority(a) - getModelPriority(b)
  if (variantDiff !== 0) return variantDiff

  return a.localeCompare(b, 'en')
}

function buildModelSections(products: GroupedProduct[]): ModelSectionGroup[] {
  const groups = new Map<string, GroupedProduct[]>()

  products.forEach((item) => {
    const model = item.product.model
    const existing = groups.get(model) ?? []
    existing.push(item)
    groups.set(model, existing)
  })

  return Array.from(groups.entries())
    .map(([title, items]) => ({
      title,
      family: getModelFamily(title),
      items: [...items].sort((a, b) => getCapacityOrder(a.product.capacity) - getCapacityOrder(b.product.capacity)),
    }))
    .sort((a, b) => sortModelTitles(a.title, b.title))
}

function formatUpdatedAt(value: string, language: 'en' | 'zh' | 'ja'): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function ProductRow({
  item,
  onSelect,
  fxRates,
}: {
  item: GroupedProduct
  onSelect: (item: GroupedProduct) => void
  fxRates: typeof DEFAULT_FX_RATES
}) {
  const { t } = useI18n()
  const sortedPrices = [...item.prices].sort((a, b) => b.price - a.price)
  const bestPrice = sortedPrices[0]
  const retailPrice = item.product.retail_price
  const profit = getProfit(bestPrice.price, retailPrice)

  if (!item.product.capacity || item.product.capacity.trim() === '' || item.product.capacity === 'GB') {
    return null
  }

  if (!bestPrice) {
    return null
  }

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:grid sm:grid-cols-[100px_1fr_100px_80px] sm:gap-4"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{formatCapacity(item.product.capacity)}</p>
          {retailPrice !== null && (
            <p className="text-xs text-slate-500 mt-0.5">
              {t('retailLabel')} {formatPrice(retailPrice)}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold text-slate-900">{formatPrice(bestPrice.price)}</p>
            {profit !== null && (
              <p className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ({formatSignedPrice(profit)})
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {Object.entries(fxRates)
              .map(([currency, data]) => `${currency} ${formatFxPrice(bestPrice.price, data.rate, data.symbol)}`)
              .join(' / ')}
          </p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-sm text-slate-600">{bestPrice.store.name}</p>
        </div>
        <div className="min-w-0 text-right">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('details')}</span>
        </div>
      </button>
    </div>
  )
}

function ProductPriceModal({
  item,
  onClose,
}: {
  item: GroupedProduct | null
  onClose: () => void
}) {
  const { t } = useI18n()
  useEffect(() => {
    if (!item) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  if (!item) return null

  const sortedPrices = [...item.prices].sort((a, b) => b.price - a.price)
  const retailPrice = item.product.retail_price

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="price-modal-title" className="text-lg font-semibold text-slate-900 sm:text-xl">
              {item.product.model} {formatCapacity(item.product.capacity)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{t('allStoresLatestPrices')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto">
          <div className="overflow-x-auto px-4 py-4 sm:px-6">
            <table className="min-w-full table-auto text-left">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">{t('store')}</th>
                  <th className="px-3 py-3">{t('buybackPrice')}</th>
                  <th className="px-3 py-3">{t('retailPrice')}</th>
                  <th className="px-3 py-3">{t('profit')}</th>
                  <th className="px-3 py-3">{t('change')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPrices.map((price) => {
                  const profit = price.profit ?? getProfit(price.price, retailPrice)
                  const changeClass =
                    price.price_change > 0
                      ? 'text-emerald-600'
                      : price.price_change < 0
                        ? 'text-red-600'
                        : 'text-slate-500'

                  return (
                    <tr key={price.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{price.store.name}</span>
                            {price.store.is_sponsored && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Sponsor
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{formatPrice(price.price)}</td>
                      <td className="px-3 py-3">{retailPrice !== null ? formatPrice(retailPrice) : '-'}</td>
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
      </div>
    </div>
  )
}

function ModelSection({
  title,
  items,
  onSelect,
  fxRates,
}: {
  title: string
  items: GroupedProduct[]
  onSelect: (item: GroupedProduct) => void
  fxRates: typeof DEFAULT_FX_RATES
}) {
  const { t } = useI18n()
  if (items.length === 0) return null

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[120px_minmax(0,1fr)_180px_24px] sm:gap-4">
        <span>{t('capacity')}</span>
        <span>{t('topPriceRetailProfit')}</span>
        <span>{t('store')}</span>
        <span />
      </div>
      <div>
        {items.map((item) => (
          <ProductRow key={item.product.id} item={item} onSelect={onSelect} fxRates={fxRates} />
        ))}
      </div>
    </section>
  )
}

export default function PriceTable() {
  const { language, t } = useI18n()
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null)
  const [selectedFamily, setSelectedFamily] = useState<string>('all')

  const { data: fxData } = useQuery<FxResponse>({
    queryKey: ['fx'],
    queryFn: async () => {
      return apiGet<FxResponse>('/api/v1/fx')
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  const fxRates = fxData?.rates ?? DEFAULT_FX_RATES

  const { data: prices, isLoading } = useQuery<Price[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      return apiGet<Price[]>('/api/v1/prices', {
        params: { limit: 1000 },
      })
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: async () => {
      return apiGet<StatsResponse>('/api/v1/stats')
    },
    staleTime: 1000 * 60,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    )
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center">
        <p className="text-sm text-slate-500">{t('noData')}</p>
      </div>
    )
  }

  const grouped = prices.reduce((acc, price) => {
    const productId = price.product.id
    if (!acc[productId]) {
      acc[productId] = {
        product: price.product,
        prices: [],
      }
    }
    acc[productId].prices.push(price)
    return acc
  }, {} as Record<number, GroupedProduct>)

  const sections = buildModelSections(Object.values(grouped))
  const families = Array.from(new Set(sections.map((section) => section.family))).sort(
    (a, b) => getFamilyNumber(b) - getFamilyNumber(a),
  )
  const visibleSections =
    selectedFamily === 'all'
      ? sections
      : sections.filter((section) => section.family === selectedFamily)
  const latestUpdatedAt = stats?.last_updated ?? null
  const isUpdateStale =
    latestUpdatedAt !== null && Date.now() - new Date(latestUpdatedAt).getTime() > 1000 * 60 * 90

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{t('priceLastUpdated')}</p>
            <p className="mt-1 text-sm text-slate-500">
              {latestUpdatedAt ? formatUpdatedAt(latestUpdatedAt, language) : t('noData')}
            </p>
            {isUpdateStale && <p className="mt-1 text-xs text-amber-700">{t('priceUpdateStale')}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFamily('all')}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selectedFamily === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {t('filterAll')}
            </button>
            {families.map((family) => (
              <button
                key={family}
                type="button"
                onClick={() => setSelectedFamily(family)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedFamily === family
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {family}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {visibleSections.map((section) => (
          <ModelSection
            key={section.title}
            title={section.title}
            items={section.items}
            onSelect={setSelectedProduct}
            fxRates={fxRates}
          />
        ))}
      </div>
      <ProductPriceModal item={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  )
}
