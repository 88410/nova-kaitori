import { useState } from 'react'
import { TrendingUp, DollarSign, RefreshCw } from 'lucide-react'

interface ExchangeRates {
  USD: number
  HKD: number
  CNY: number
  EUR: number
  JPY: number
}

const SYMBOLS: Record<string, string> = {
  USD: '$',
  HKD: 'HK$',
  CNY: '¥',
  EUR: '€',
  JPY: '¥'
}

const NAMES: Record<string, string> = {
  USD: 'USD',
  HKD: 'HKD',
  CNY: 'CNY',
  EUR: 'EUR',
  JPY: 'JPY'
}

// 实时汇率 (2026-02-25 从 exchangerate-api.com 获取)
// 1 JPY = ?
const RATES: ExchangeRates = {
  USD: 0.00642,
  HKD: 0.0502,
  CNY: 0.0442,
  EUR: 0.00545,
  JPY: 1
}

// 示例价格：194,800 JPY (iPhone 17 256GB 苹果官方价格)
const SAMPLE_PRICE = 194800

export default function ExchangeRates() {
  const [rates] = useState<ExchangeRates>(RATES)
  const [lastUpdated] = useState<string>('2026-02-25')

  // Format price in foreign currency
  const formatPrice = (jpyAmount: number, currency: string): string => {
    const rate = rates[currency as keyof ExchangeRates]
    const converted = jpyAmount * rate
    const symbol = SYMBOLS[currency]
    
    if (currency === 'JPY') {
      return `${symbol}${jpyAmount.toLocaleString()}`
    }
    
    // For other currencies, show with appropriate decimal places
    if (converted >= 1000) {
      return `${symbol}${converted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    } else if (converted >= 100) {
      return `${symbol}${converted.toFixed(0)}`
    } else {
      return `${symbol}${converted.toFixed(2)}`
    }
  }

  // Format rate display (1 JPY = ?)
  const formatRate = (currency: string): string => {
    const rate = rates[currency as keyof ExchangeRates]
    if (rate >= 0.1) {
      return rate.toFixed(3)
    } else if (rate >= 0.01) {
      return rate.toFixed(4)
    } else {
      return rate.toFixed(5)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 mb-6 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-300" />
          <h3 className="text-lg font-bold">外国為替レート / Exchange Rates</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <RefreshCw className="w-3 h-3" />
          <span>{lastUpdated} 更新</span>
        </div>
      </div>
      
      {/* 汇率表 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {Object.keys(rates).map((currency) => (
          <div key={currency} className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-yellow-300" />
              <span className="font-bold text-lg">{NAMES[currency]}</span>
            </div>
            <p className="text-sm text-gray-200">
              1 JPY = {formatRate(currency)}
            </p>
          </div>
        ))}
      </div>

      {/* 194800 JPY 示例价格 */}
      <div className="bg-white/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-yellow-300">
            iPhone 17 256GB 参考価格 (公式 ¥194,800)
          </span>
          <span className="text-xs text-gray-300">
            Reference: ¥194,800
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.keys(rates).map((currency) => (
            <div key={`sample-${currency}`} className="text-center">
              <p className="text-xs text-gray-300 mb-1">{NAMES[currency]}</p>
              <p className="text-xl font-bold text-white">
                {formatPrice(SAMPLE_PRICE, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-300 mt-3 text-center">
        ※ 為替レートは参考値です (Source: exchangerate-api.com) / Exchange rates are for reference only
      </p>
    </div>
  )
}