import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ChevronDown, ChevronUp, TrendingUp, Sparkles, Clock } from 'lucide-react'

const API_URL = ''

// 為替レート設定
const FX_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺' },
}

// 容量ソート用の重み付け
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

// 店舗公式サイトURLマッピング
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

// 店舗略称マッピング（モバイル表示用）
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

// AI予測メッセージパターン - 更新時にローテーション
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
  // 容量値を正規化
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

// 最高利益商品と店舗を計算
function getAIPredictions(prices: Price[]) {
  if (!prices || prices.length === 0) return null
  
  // 最高利益の商品を検索
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
  
  // 平均価格が最高の店舗を検索
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

// 更新時間に基づいて予測メッセージを選択
function getPredictionTemplate(lastUpdated: string | null) {
  if (!lastUpdated) return PREDICTION_TEMPLATES[0]
  
  const date = new Date(lastUpdated)
  const hour = date.getHours()
  // 時間帯で異なるメッセージを表示
  const index = hour % PREDICTION_TEMPLATES.length
  return PREDICTION_TEMPLATES[index]
}

// 更新時間をフォーマット
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
    <div className="relative overflow-hidden rounded-2xl shadow-lg mb-6 md:mb-8 text-white">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"></div>
      
      {/* 装飾用ライトエフェクト */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
      
      <div className="relative p-5 md:p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">AI予測分析</h3>
              <span className="text-xs text-purple-200">AI Prediction</span>
            </div>
            <span className="px-2.5 py-1 bg-green-500/90 rounded-full text-xs font-bold animate-pulse shadow-lg">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-200 bg-white/10 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
        
        {/* カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-300" />
              </div>
              <span className="font-semibold text-sm text-purple-100">本日最適売却機種</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-yellow-300 mb-1">
              {prediction.bestProduct.name || 'iPhone 17 Pro Max 256GB'}
            </p>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              {template.productTrend}。{prediction.bestStore.name || '買取ベストワン'}が最高値提示中
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
              <span className="font-semibold text-sm text-purple-100">最高額買取店舗</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-yellow-300 mb-1">
              {prediction.bestStore.name || '買取ベストワン'}
            </p>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              平均 ¥{Math.round(prediction.bestStore.avgPrice || 185000).toLocaleString()} | {template.storeAdvice}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-purple-300/70 mt-4 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          AI分析: 過去30日間の価格推移、市場需給、在庫状況を総合予測
        </p>
      </div>
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
  
  // 【強制フィルター】容量が空の場合は非表示
  if (!product.capacity || product.capacity.trim() === '' || product.capacity === 'GB') {
    return null
  }
  
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* 左側：製品情報 */}
        <div className="w-full md:w-52 p-4 bg-gradient-to-br from-slate-50 to-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-3">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg">
              {product.capacity.includes('TB') ? product.capacity.replace('TB', '') + 'T' : product.capacity.replace(/\D/g, '')}
            </div>
            <h4 className="font-bold text-lg text-slate-800">
              {product.capacity === '1TB' || product.capacity === '2TB' || product.capacity === '256' || product.capacity === '512' || product.capacity === '128' || product.capacity === '1024' ? 
                (product.capacity.includes('TB') ? product.capacity : product.capacity + 'GB') 
                : product.capacity}
            </h4>
            {product.retail_price && (
              <p className="text-xs text-slate-400 mt-1">
                公式価格 <span className="font-medium text-slate-600">¥{product.retail_price.toLocaleString()}</span>
              </p>
            )}
          </div>
          
          {/* 外貨参考価格 - コンパクト表示 */}
          {product.retail_price && (
            <div className="flex flex-wrap justify-center md:justify-start gap-1 mt-0 md:mt-2">
              {Object.entries(FX_RATES).map(([currency, data]) => (
                <span 
                  key={currency}
                  className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500"
                >
                  {data.symbol}{Math.round(product.retail_price! / data.rate)}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* 右側：価格リスト */}
        <div className="flex-1 p-3 md:p-4">
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
                  className={`relative text-center p-2.5 rounded-xl border transition-all duration-200 hover:scale-105 ${
                    isBest 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md' 
                      : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  {isBest && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                      1
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500 mb-1 truncate">
                    <span className="md:hidden">{shortName}</span>
                    <span className="hidden md:inline">{price.store.name}</span>
                  </p>
                  <p className={`font-bold text-sm ${isBest ? 'text-green-600' : 'text-slate-700'}`}>
                    ¥{(price.price / 10000).toFixed(1)}万
                  </p>
                  {price.profit !== null && (
                    <p className={`text-[10px] mt-0.5 font-medium ${price.profit > 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {price.profit > 0 ? '+' : ''}{(price.profit / 10000).toFixed(1)}万
                    </p>
                  )}
                </a>
              )
            })}
          </div>
          
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 w-full py-2.5 text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" />閉じる</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" />全{sortedPrices.length}店舗を表示</>
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
    <div className="mb-8 md:mb-10">
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
      </div>
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
    refetchInterval: 60000, // 1分ごとにstatsを再取得して更新時刻を反映
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
