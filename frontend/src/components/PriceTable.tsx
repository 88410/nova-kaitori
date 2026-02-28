import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { apiGet } from '../lib/api'
import { FX_RATES } from '../lib/fx'

interface Store {
  id: number
  name: string
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
  store: Store
  product: Product
  profit: number | null
}

interface GroupedProduct {
  product: Product
  prices: Price[]
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

const MODEL_ORDER = [
  'iPhone 17 Pro Max',
  'iPhone 17 Pro',
  'iPhone 17 Air',
  'iPhone 17',
  'iPhone 16 Pro Max',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 16e',
] as const

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

function groupByModel(products: GroupedProduct[]) {
  const groups: Record<string, GroupedProduct[]> = Object.fromEntries(
    MODEL_ORDER.map((model) => [model, [] as GroupedProduct[]])
  )

  products.forEach((item) => {
    const model = item.product.model

    if (model.includes('17 Pro Max')) {
      groups['iPhone 17 Pro Max'].push(item)
    } else if (model.includes('17 Pro')) {
      groups['iPhone 17 Pro'].push(item)
    } else if (model.includes('17 Air')) {
      groups['iPhone 17 Air'].push(item)
    } else if (model === 'iPhone 17') {
      groups['iPhone 17'].push(item)
    } else if (model.includes('16 Pro Max')) {
      groups['iPhone 16 Pro Max'].push(item)
    } else if (model.includes('16 Plus')) {
      groups['iPhone 16 Plus'].push(item)
    } else if (model === 'iPhone 16') {
      groups['iPhone 16'].push(item)
    } else if (model.includes('16e')) {
      groups['iPhone 16e'].push(item)
    }
  })

  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => getCapacityOrder(a.product.capacity) - getCapacityOrder(b.product.capacity))
  })

  return groups
}

function ProductAccordion({ item }: { item: GroupedProduct }) {
  const [expanded, setExpanded] = useState(false)
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
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:grid sm:grid-cols-[120px_minmax(0,1fr)_180px_24px] sm:gap-4"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{formatCapacity(item.product.capacity)}</p>
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <p className="text-lg font-semibold text-slate-900">{formatPrice(bestPrice.price)}</p>
          {profit !== null && (
            <p className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              利益 {formatSignedPrice(profit)}
            </p>
          )}
          {retailPrice !== null && (
            <div className="mt-1 space-y-1">
              <p className="text-xs text-slate-500">定価 {formatPrice(retailPrice)}</p>
              <p className="text-xs text-slate-500">
                {Object.entries(FX_RATES)
                  .map(([currency, data]) => `${currency} ${formatFxPrice(retailPrice, data.rate, data.symbol)}`)
                  .join(' / ')}
              </p>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-600">{bestPrice.store.name}</p>
        </div>
        <div className="ml-auto text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="grid gap-2">
            {sortedPrices.map((price) => (
              <div
                key={price.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">{price.store.name}</p>
                </div>
                <p className="text-sm font-medium text-slate-900">{formatPrice(price.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelSection({ title, items }: { title: string; items: GroupedProduct[] }) {
  if (items.length === 0) return null

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[120px_minmax(0,1fr)_180px_24px] sm:gap-4">
        <span>容量</span>
        <span>最高買取価格 / 定価 / 利益</span>
        <span>店舗名</span>
        <span />
      </div>
      <div>
        {items.map((item) => (
          <ProductAccordion key={item.product.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export default function PriceTable() {
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
        <p className="text-sm text-slate-500">データがありません</p>
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

  const byModel = groupByModel(Object.values(grouped))

  return (
    <div className="space-y-4">
      {MODEL_ORDER.map((model) => (
        <ModelSection key={model} title={model} items={byModel[model]} />
      ))}
    </div>
  )
}
