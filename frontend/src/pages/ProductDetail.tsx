import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = ''

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

interface HistoryEntry {
  price: number
  recorded_at: string
}

interface PriceHistory {
  product: Product
  store: Store
  history: HistoryEntry[]
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { data: prices } = useQuery<PriceWithStore[]>({
    queryKey: ['product-prices', productId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/prices/latest/${productId}`)
      return res.data
    },
  })

  const bestPrice = prices?.[0]
  const product = bestPrice?.product

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            戻る
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {product && bestPrice && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-4xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                    ) : '📱'}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{product.model}</h1>
                    <p className="text-lg text-gray-600 mt-1">
                      {product.capacity} · {product.color} · {product.carrier}
                    </p>
                    {product.retail_price && (
                      <p className="text-gray-500 mt-2">新品時価格: ¥{product.retail_price.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">最高買取価格</p>
                  <p className="text-4xl font-bold text-green-600">¥{bestPrice.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">{bestPrice.store.name}</p>
                  {bestPrice.profit !== null && bestPrice.profit > 0 && (
                    <p className="text-green-600 mt-1">利益 ¥{bestPrice.profit.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">店舗別買取価格</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {prices?.map((price) => (
                  <div
                    key={price.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">{price.store.name}</span>
                      {price.is_best_price === 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          最高値!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-6">
                      {price.price_change !== 0 && (
                        <div className={`flex items-center space-x-1 ${price.price_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {price.price_change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                          <span className="text-sm">
                            {Math.abs(price.price_change).toLocaleString()} ({price.price_change_percent}%)
                          </span>
                        </div>
                      )}
                      {price.profit !== null && (
                        <span className={`text-sm ${price.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          利益 {price.profit > 0 ? '+' : ''}¥{price.profit.toLocaleString()}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-gray-900">¥{price.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {prices && prices.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">価格推移</h2>
                </div>
                <PriceHistoryChart storeId={bestPrice.store.id} productId={productId} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PriceHistoryChart({ storeId, productId }: { storeId: number; productId: number }) {
  const { data: history } = useQuery<PriceHistory>({
    queryKey: ['price-history', productId, storeId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/history/${productId}/${storeId}?days=30`)
      return res.data
    },
  })

  if (!history?.history?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        履歴データがありません
      </div>
    )
  }

  const chartData = history.history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    price: h.price,
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis
            stroke="#6b7280"
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            domain={['dataMin - 5000', 'dataMax + 5000']}
          />
          <Tooltip
            formatter={(value: number) => [`¥${value.toLocaleString()}`, '価格']}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Legend />
          <Line type="monotone" dataKey="price" name="買取価格" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
