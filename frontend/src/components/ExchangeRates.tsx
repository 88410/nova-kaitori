import { useState } from 'react'
import { TrendingUp, DollarSign } from 'lucide-react'

interface ExchangeRates {
  USD: number
  HKD: number
  CNY: number
  EUR: number
  JPY: number
}

const RATES: ExchangeRates = {
  USD: 0.0067,   // 1 JPY = 0.0067 USD (1 USD = 150 JPY)
  HKD: 0.052,    // 1 JPY = 0.052 HKD (1 HKD = 19.2 JPY)
  CNY: 0.048,    // 1 JPY = 0.048 CNY (1 CNY = 20.8 JPY)
  EUR: 0.0062,   // 1 JPY = 0.0062 EUR (1 EUR = 162 JPY)
  JPY: 1
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

export default function ExchangeRates() {
  const [rates] = useState<ExchangeRates>(RATES)

  // Format price in foreign currency
  const formatPrice = (jpyAmount: number, currency: string): string => {
    const converted = jpyAmount * rates[currency as keyof ExchangeRates]
    const symbol = SYMBOLS[currency]
    
    if (currency === 'JPY') {
      return `${symbol}${jpyAmount.toLocaleString()}`
    }
    
    // For other currencies, show with appropriate decimal places
    if (converted >= 1000) {
      return `${symbol}${converted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    } else {
      return `${symbol}${converted.toFixed(2)}`
    }
  }

  // Sample prices for display (average iPhone buyback price)
  const samplePrice = 200000 // 200,000 JPY

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 mb-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-yellow-300" />
        <h3 className="text-lg font-bold">外国為替レート / Exchange Rates</h3>
        <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">参考価格 (Reference)</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.keys(rates).map((currency) => (
          <div key={currency} className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-yellow-300" />
              <span className="font-bold text-lg">{NAMES[currency]}</span>
            </div>
            <p className="text-sm text-gray-200">
              {currency === 'JPY' ? '基準 / Base' : `1 JPY = ${rates[currency as keyof ExchangeRates]}`}
            </p>
            <p className="text-xs text-yellow-300 mt-1">
              ¥200,000 ≈ {formatPrice(samplePrice, currency)}
            </p>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-300 mt-2 text-center">
        ※ 為替レートは参考値です / Exchange rates are for reference only
      </p>
    </div>
  )
}