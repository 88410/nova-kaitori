import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PriceTable from './components/PriceTable'
import ProductDetail from './pages/ProductDetail'
import Stats from './components/Stats'
import { RefreshCw } from 'lucide-react'

// 為替レート設定
const FX_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺' },
}

function Home() {
  const [, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="border-b border-slate-200">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              NOVA買取サイト
            </h1>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              iPhoneの最高買取価格を店舗別に比較できます。
            </p>
            <div className="mt-6">
              <SearchBar onSearch={setSearchQuery} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Stats />
      </div>

      <div className="container mx-auto px-4 pb-10">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">買取価格一覧</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">FX Rate</span>
              <div className="flex items-center gap-1.5">
                {Object.entries(FX_RATES).map(([currency, data]) => (
                  <div
                    key={currency}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                    title={`1 ${currency} = ${data.rate} JPY`}
                  >
                    <span>{data.flag}</span>
                    <span className="font-medium">{data.rate.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="ml-1 flex items-center gap-1 text-xs text-slate-500">
                <RefreshCw className="h-3 w-3" />
                <span>02/25</span>
              </div>
            </div>
          </div>
          <div className="p-3 md:p-6">
            <PriceTable />
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-900">ノーヴァテック株式会社</p>
          <p className="mt-1 text-xs text-slate-500">© 2026 NOVA買取サイト All rights reserved.</p>
          <p className="mt-1 text-xs text-slate-500">lzq / toda</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />
    </Routes>
  )
}

export default App
