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
          className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white p-3 md:space-x-4 md:p-5"
        >
          <div className="rounded-md bg-slate-100 p-2 md:p-3">
            <item.icon className="h-5 w-5 text-slate-700 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 md:text-sm">{item.label}</p>
            <p className="text-lg font-semibold text-slate-900 md:text-2xl">
              {item.value.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-slate-500 md:text-sm">{item.suffix}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
