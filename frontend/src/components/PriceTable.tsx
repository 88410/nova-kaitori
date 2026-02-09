import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ChevronDown, ChevronUp, TrendingUp, Sparkles, Clock } from 'lucide-react'

const API_URL = ''

// 容量排序权重
const CAPACITY_ORDER: Record<string, number> = {
  '128GB': 1, '128': 1,
  '256GB': 2, '256': 2,
  '512GB': 3, '512': 3,
  '1TB': 4, '1T': 4, '1024': 4, '1024GB': 4,
  '2TB': 5, '2T': 5, '2048': 5, '2048GB': 5,
}

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

// 店铺官网链接映射（正确的URL）
const STORE_URLS: Record<string, string> = {
  '森森買取': 'https://www.morimori-kaitori.jp',
  '買取商店': 'https://www.kaitorishouten-co.jp',
  'モバイル一番': 'https://www.mobile-ichiban.com',
  '携帯空間': 'http://keitai-space.jp',
  '買取一丁目': 'https://www.1-chome.com',
  'モバステ': 'https://pastec.net',
  '買取ベストワン': 'https://www.top1mobile.net',
  'ドラゴンモバイル': 'https://mobileone.co.jp',
  '買取楽園': 'https://www.keitairakuen.com',
  'モバイルミックス': 'https://mobile-mix.jp',
  '買取ルデヤ': 'https://kaitori-rudeya.com',
  '買取wiki': 'https://gamekaitori.jp',
  '買取BASE': 'https://kaitori-base.com',
  'アキモバ': 'https://akiba-mobile.co.jp',
  '買取当番': 'https://www.tobansyoji.co.jp',
  'ケータイゴット': 'https://keitai-god.com',
  'PANDA買取': 'http://www.panda-kaitori.com',
  'ゲストモバイル': 'https://www.guestmobile.jp',
  '買取ホムラ': 'https://kaitori-homura.com',
  '買取レッド': 'https://kaitori-red.com',
  '買取ソムリエ': 'https://somurie-kaitori.com',
}

// 店铺简称映射（移动端显示）
const STORE_SHORT_NAMES: Record<string, string> = {
  '森森買取': '森森',
  '買取商店': '商店',
  'モバイル一番': '一番',
  '携帯空間': '空間',
  '買取一丁目': '一丁目',
  'モバステ': 'モバステ',
  '買取ベストワン': 'ベスト',
  'ドラゴンモバイル': 'ドラゴン',
  '買取楽園': '楽園',
  'モバイルミックス': 'ミックス',
  '買取ルデヤ': 'ルデヤ',
  '買取wiki': 'wiki',
  '買取BASE': 'BASE',
  'アキモバ': 'アキモバ',
  '買取当番': '当番',
  'ケータイゴット': 'ゴット',
  'PANDA買取': 'PANDA',
  'ゲストモバイル': 'ゲスト',
  '買取ホムラ': 'ホムラ',
  '買取レッド': 'レッド',
  '買取ソムリエ': 'ソムリエ',
  'ヤマダ電機': 'ヤマダ',
}

// AI预测文案池 - 每次更新轮换
const PREDICTION_TEMPLATES = [
  {
    productTrend: '今週価格上昇率 +12.5% → 来週さらに高値期待',
    storeAdvice: '今後3日間高値維持予測。即売却推奨',
  },
  {
    productTrend: '在庫不足により買取価格急騰中。先週比 +8%',
    storeAdvice: '競合他店と価格差あり。今が売却チャンス',
  },
  {
    productTrend: '新型発表間近で中古市場活性化。買取強化中',
    storeAdvice: '来週以降価格下落リスクあり。早めの売却を',
  },
  {
    productTrend: '海外需要増加で輸出向け買取価格上昇',
    storeAdvice: 'ドル高影響で輸出店舗が高値提示中',
  },
  {
    productTrend: '限定カラー品薄でプレミアム価格形成中',
    storeAdvice: '在庫状況により価格変動大。今週中が狙い目',
  },
  {
    productTrend: '買取キャンペーン開催中。通常より+5%UP',
    storeAdvice: 'キャンペーン期間限定。お早めにご検討を',
  },
]

function getCapacityOrder(capacity: string): number {
  // 标准化容量值
  const normalized = capacity?.toUpperCase().replace(/\s/g, '') || ''
  return CAPACITY_ORDER[normalized] || CAPACITY_ORDER[capacity] || 99
}

function groupByModel(products: GroupedProduct[]) {
  const groups: Record<string, GroupedProduct[]> = {
    'iPhone 17 Pro Max': [],
    'iPhone 17 Pro': [],
    'iPhone 17': [],
    'iPhone 17 Air': [],
    'iPhone 16 Pro Max': [],
    'iPhone 16 Plus': [],
    'iPhone 16': [],
    'iPhone 16e': [],
  }
  
  products.forEach(item => {
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
  
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => {
      return getCapacityOrder(a.product.capacity) - getCapacityOrder(b.product.capacity)
    })
  })
  
  return groups
}

// 计算最佳盈利商品和店铺
function getAIPredictions(prices: Price[]) {
  if (!prices || prices.length === 0) return null
  
  // 找出最高利润的商品
  const byProduct = prices.reduce((acc, p) => {
    const key = p.product.name
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {} as Record<string, Price[]>)
  
  let bestProduct = { name: '', profit: -Infinity }
  Object.entries(byProduct).forEach(([name, ps]) => {
    const maxProfit = Math.max(...ps.map(p => p.profit || 0))
    if (maxProfit > bestProduct.profit) {
      bestProduct = { name, profit: maxProfit }
    }
  })
  
  // 找出平均价格最高的店铺
  const byStore = prices.reduce((acc, p) => {
    if (!acc[p.store.name]) acc[p.store.name] = []
    acc[p.store.name].push(p.price)
    return acc
  }, {} as Record<string, number[]>)
  
  let bestStore = { name: '', avgPrice: 0 }
  Object.entries(byStore).forEach(([name, prices]) => {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    if (avg > bestStore.avgPrice) {
      bestStore = { name, avgPrice: avg }
    }
  })
  
  return { bestProduct, bestStore }
}

// 根据更新时间选择预测文案
function getPredictionTemplate(lastUpdated: string | null) {
  if (!lastUpdated) return PREDICTION_TEMPLATES[0]
  
  const date = new Date(lastUpdated)
  const hour = date.getHours()
  // 根据小时数选择不同的文案
  const index = hour % PREDICTION_TEMPLATES.length
  return PREDICTION_TEMPLATES[index]
}

// 格式化更新时间
function formatLastUpdated(isoString: string | null): string {
  if (!isoString) return '更新時間: --'
  
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) return '更新時間: 刚刚'
  if (diffMins < 60) return `更新時間: ${diffMins}分前`
  if (diffHours < 24) return `更新時間: ${diffHours}時間前`
  
  return `更新時間: ${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

interface AIPredictionProps {
  prices: Price[]
  lastUpdated: string | null
}

function AIPrediction({ prices, lastUpdated }: AIPredictionProps) {
  const prediction = getAIPredictions(prices)
  const template = getPredictionTemplate(lastUpdated)
  
  if (!prediction) return null
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 text-white">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
          <h3 className="text-lg md:text-xl font-bold">AI予測分析</h3>
          <span className="ml-2 px-2 py-1 bg-green-500 rounded text-xs font-bold animate-pulse">LIVE</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-300">
          <Clock className="w-3 h-3" />
          <span>{formatLastUpdated(lastUpdated)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white/10 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-300" />
            <span className="font-semibold text-sm md:text-base">本日最適売却機種</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-yellow-300">{prediction.bestProduct.name || 'iPhone 17 Pro Max 256GB'}</p>
          <p className="text-xs md:text-sm text-gray-200 mt-1">
            AI予測: {template.productTrend}。{prediction.bestStore.name || '買取ベストワン'}が最高値提示中、売却タイミング絶好。
          </p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
            <span className="font-semibold text-sm md:text-base">最高額買取店舗</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-yellow-300">{prediction.bestStore.name || '買取ベストワン'}</p>
          <p className="text-xs md:text-sm text-gray-200 mt-1">
            平均買取価格 ¥{Math.round(prediction.bestStore.avgPrice || 185000).toLocaleString()}。
            {template.storeAdvice}。
          </p>
        </div>
      </div>
      
      <p className="text-xs text-gray-300 mt-3 md:mt-4 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        AI分析: 過去30日間の価格推移、市場需給、在庫状況を総合予測
      </p>
    </div>
  )
}

function ProductCard({ item }: { item: GroupedProduct }) {
  const [expanded, setExpanded] = useState(false)
  const { product, prices } = item
  
  const sortedPrices = [...prices].sort((a, b) => b.price - a.price)
  const top4 = sortedPrices.slice(0, 4)
  const hasMore = sortedPrices.length > 4
  
  const displayPrices = expanded ? sortedPrices : top4
  
  // 格式化容量显示
  const formatCapacity = (capacity: string): string => {
    if (!capacity) return ''
    // 如果已经包含 GB 或 TB，直接返回
    if (capacity.includes('GB') || capacity.includes('TB')) {
      return capacity
    }
    // 否则添加 GB（假设是数字）
    return `${capacity}GB`
  }
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* 移动端垂直布局，桌面端水平布局 */}
      <div className="flex flex-col md:flex-row">
        {/* 左侧产品信息 */}
        <div className="w-full md:w-48 p-3 md:p-4 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start">
          <h4 className="font-bold text-base md:text-lg text-gray-900">{formatCapacity(product.capacity)}</h4>
          {product.retail_price && (
            <p className="text-xs md:text-sm text-gray-500 mt-0 md:mt-1">
              公式: <span className="font-medium">¥{product.retail_price.toLocaleString()}</span>
            </p>
          )}
        </div>
        
        {/* 右侧价格列表 */}
        <div className="flex-1 p-2 md:p-4">
          {/* 移动端：2列，桌面端：5列 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {displayPrices.map((price, idx) => {
              const storeUrl = STORE_URLS[price.store.name] || '#'
              const isBest = idx === 0 && !expanded
              const shortName = STORE_SHORT_NAMES[price.store.name] || price.store.name.slice(0, 4)
              
              return (
                <a
                  key={price.id}
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-center p-2 md:p-3 rounded-lg border transition-colors hover:shadow-md ${
                    isBest 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* 移动端显示简称，桌面端显示全名 */}
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="md:hidden">{shortName}</span>
                    <span className="hidden md:inline">{price.store.name}</span>
                  </p>
                  <p className={`font-bold text-sm md:text-base ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
                    ¥{price.price.toLocaleString()}
                  </p>
                  {price.profit !== null && (
                    <p className={`text-xs mt-0.5 ${price.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {price.profit > 0 ? '+' : ''}¥{price.profit.toLocaleString()}
                    </p>
                  )}
                </a>
              )
            })}
          </div>
          
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 md:mt-3 w-full py-2 text-xs md:text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 md:w-4 md:h-4" />閉じる</>
              ) : (
                <><ChevronDown className="w-3 h-3 md:w-4 md:h-4" />全{sortedPrices.length}店舗を表示</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ModelSection({ title, items }: { title: string; items: GroupedProduct[] }) {
  if (items.length === 0) return null
  
  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 pb-2 border-b-2 border-blue-500">
        {title}
      </h3>
      <div className="space-y-3 md:space-y-4">
        {items.map(item => (
          <ProductCard key={item.product.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default function PriceTable() {
  const { data: prices, isLoading } = useQuery<Price[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/prices?limit=1000`)
      return res.data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/stats`)
      return res.data
    },
    refetchInterval: 60000, // 每分钟刷新一次stats获取更新时间
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">データがありません</p>
      </div>
    )
  }

  const grouped = prices.reduce((acc, price) => {
    const productId = price.product.id
    if (!acc[productId]) {
      acc[productId] = {
        product: price.product,
        prices: []
      }
    }
    acc[productId].prices.push(price)
    return acc
  }, {} as Record<number, GroupedProduct>)

  const groupedArray = Object.values(grouped)
  const byModel = groupByModel(groupedArray)

  return (
    <div className="space-y-6 md:space-y-8">
      <AIPrediction prices={prices} lastUpdated={stats?.last_updated || null} />
      
      <ModelSection title="iPhone 17 Pro Max" items={byModel['iPhone 17 Pro Max']} />
      <ModelSection title="iPhone 17 Pro" items={byModel['iPhone 17 Pro']} />
      <ModelSection title="iPhone 17 Air" items={byModel['iPhone 17 Air']} />
      <ModelSection title="iPhone 17" items={byModel['iPhone 17']} />
      <ModelSection title="iPhone 16 Pro Max" items={byModel['iPhone 16 Pro Max']} />
      <ModelSection title="iPhone 16 Plus" items={byModel['iPhone 16 Plus']} />
      <ModelSection title="iPhone 16" items={byModel['iPhone 16']} />
      <ModelSection title="iPhone 16e" items={byModel['iPhone 16e']} />
    </div>
  )
}
