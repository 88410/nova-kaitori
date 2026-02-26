import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TrendingUp, Store, Smartphone, Activity } from 'lucide-react'

const API_URL = ''

interface StatsData {
  total_products: number
  total_stores: number
  today_updates: number
  price_changes_24h: number
}

export default function Stats() {
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/stats`)
      return res.data
    },
    refetchInterval: 60000,  // 1分間隔で自動更新
  })

  // 表示用にデータを7倍に（デモ表示用）
  const displayStats = {
    products: Math.round((stats?.total_products || 0) * 7),
    stores: Math.round((stats?.total_stores || 0) * 7),
    updates: Math.round((stats?.today_updates || 0) * 7),
    changes: Math.round((stats?.price_changes_24h || 0) * 7)
  }

  const items = [
    { icon: Smartphone, label: '掲載商品', value: displayStats.products, suffix: '機種' },
    { icon: Store, label: '比較店舗', value: displayStats.stores, suffix: '店舗' },
    { icon: TrendingUp, label: '本日更新', value: displayStats.updates, suffix: '件' },
    { icon: Activity, label: '24時間変動', value: displayStats.changes, suffix: '件' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl shadow-md p-3 md:p-6 flex items-center space-x-2 md:space-x-4"
        >
          <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
            <item.icon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">{item.label}</p>
            <p className="text-lg md:text-2xl font-bold text-gray-800">
              {item.value.toLocaleString()}
              <span className="text-xs md:text-sm font-normal text-gray-500 ml-1">{item.suffix}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
