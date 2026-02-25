import { useState } from 'react'
import { TrendingUp, RefreshCw, Smartphone } from 'lucide-react'

// 实时汇率 (2026-02-25) - 以外币为1单位
// 1 USD = ? JPY
const EXCHANGE_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸', name: 'USD' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰', name: 'HKD' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳', name: 'CNY' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺', name: 'EUR' },
}

// 示例价格：194,800 JPY
const SAMPLE_PRICE_JPY = 194800

interface RateCardProps {
  currency: string
  rate: number
  symbol: string
  flag: string
  name: string
  samplePrice: number
}

function RateCard({ currency, rate, symbol, flag, name, samplePrice }: RateCardProps) {
  // 计算外币价格 = JPY / rate
  const foreignPrice = samplePrice / rate
  
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      {/* 背景光效 */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative">
        {/* 货币标识 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{flag}</span>
          <span className="text-lg font-bold text-white">{name}</span>
        </div>
        
        {/* 汇率 */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">為替レート / Exchange Rate</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            1 {currency} = {rate.toFixed(2)} JPY
          </p>
        </div>
        
        {/* 参考价格 */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-1">iPhone 17 256GB 参考価格</p>
          <p className="text-xl font-bold text-white">
            {symbol}{foreignPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">¥194,800</p>
        </div>
      </div>
    </div>
  )
}

export default function ExchangeRates() {
  const [lastUpdated] = useState<string>('2026-02-25')

  return (
    <div className="mb-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">為替レート</h3>
            <p className="text-sm text-gray-400">Exchange Rates</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-gray-400">{lastUpdated}</span>
        </div>
      </div>

      {/* 汇率卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {Object.entries(EXCHANGE_RATES).map(([currency, data]) => (
          <RateCard
            key={currency}
            currency={currency}
            rate={data.rate}
            symbol={data.symbol}
            flag={data.flag}
            name={data.name}
            samplePrice={SAMPLE_PRICE_JPY}
          />
        ))}
      </div>

      {/* 提示信息 */}
      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <Smartphone className="w-3 h-3" />
        <span>為替レートは参考値です / Exchange rates are for reference only</span>
      </div>
    </div>
  )
}