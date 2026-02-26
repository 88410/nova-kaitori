import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PriceTable from './components/PriceTable'
import ProductDetail from './pages/ProductDetail'
import Stats from './components/Stats'
import { RefreshCw } from 'lucide-react'

// 汇率配置
const FX_RATES = {
  USD: { rate: 155.76, symbol: '$', flag: '🇺🇸' },
  HKD: { rate: 19.92, symbol: 'HK$', flag: '🇭🇰' },
  CNY: { rate: 22.62, symbol: '¥', flag: '🇨🇳' },
  EUR: { rate: 183.49, symbol: '€', flag: '🇪🇺' },
}

function Home() {
  const [, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-10 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            NOVA買取サイト
          </h1>
          <p className="text-base md:text-xl text-blue-100 mb-1 md:mb-2">
            AIが導く最適なiPhone買取タイミング
          </p>
          <p className="text-sm md:text-lg text-blue-200 mb-4 md:mb-8">
            リアルタイム価格比較で最高値売却
          </p>
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-2 md:px-4 -mt-6 md:-mt-8">
        <Stats />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 md:px-4 py-6 md:py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 标题 + 汇率 同一行 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              買取価格一覧
            </h2>
            
            {/* 汇率 - 标题右边 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">
                為替レート:
              </span>
              {Object.entries(FX_RATES).map(([currency, data]) => (
                <div 
                  key={currency}
                  className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1"
                  title={`1 ${currency} = ${data.rate} JPY`}
                >
                  <span className="text-sm">{data.flag}</span>
                  <span className="text-sm font-bold text-gray-700">1{currency}</span>
                  <span className="text-xs text-gray-400">=</span>
                  <span className="text-sm font-mono text-cyan-600 font-semibold">{data.rate.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                <RefreshCw className="w-3 h-3" />
                <span>2026-02-25</span>
              </div>
            </div>
          </div>
          
          <div className="p-2 md:p-6">
            <PriceTable />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 md:py-8 mt-8 md:mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">ノーヴァテック株式会社</p>
          <p className="text-xs md:text-sm text-blue-400 mb-2 md:mb-4">AI予測でiPhone売却最適化</p>
          <p className="text-xs md:text-sm">© 2026 NOVA買取サイト All rights reserved.</p>
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
