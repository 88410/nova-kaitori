import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

// リアルタイム為替レート (2026-02-25) - 外貨1単位あたり
const EXCHANGE_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺' },
}

export default function ExchangeRates() {
  const [lastUpdated] = useState<string>('2026-02-25')

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 mb-6 text-white">
      {/* タイトル + 為替を1行で表示 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-300 whitespace-nowrap">
          為替レート:
        </span>
        
        {Object.entries(EXCHANGE_RATES).map(([currency, data]) => (
          <div 
            key={currency}
            className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5"
            title={`1 ${currency} = ${data.rate} JPY`}
          >
            <span className="text-base">{data.flag}</span>
            <span className="text-sm font-bold">1{currency}</span>
            <span className="text-xs text-gray-400">=</span>
            <span className="text-sm font-mono text-cyan-300">{data.rate.toFixed(2)}</span>
          </div>
        ))}
        
        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <RefreshCw className="w-3 h-3" />
          <span>{lastUpdated}</span>
        </div>
      </div>
    </div>
  )
}
