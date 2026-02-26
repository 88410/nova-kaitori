import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PriceTable from './components/PriceTable'
import ProductDetail from './pages/ProductDetail'
import Stats from './components/Stats'
import { RefreshCw, TrendingUp, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      {/* Hero Section - 更现代的渐变 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>AI予測で最適な売却タイミングを把握</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              NOVA買取サイト
            </h1>
            <p className="text-lg md:text-2xl text-blue-100 mb-2 font-light">
              AIが導く最適なiPhone買取タイミング
            </p>
            <p className="text-sm md:text-lg text-blue-200/80 mb-8">
              リアルタイム価格比較で最高値売却
            </p>
            
            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={setSearchQuery} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-2 md:px-4 -mt-8 relative z-10">
        <Stats />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 md:px-4 py-8 md:py-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          {/* 标题 + 汇率 同一行 - 更现代的设计 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-8 py-4 md:py-5 border-b border-gray-100 gap-4 bg-gradient-to-r from-white to-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                買取価格一覧
              </h2>
            </div>
            
            {/* 汇率 - 更紧凑美观 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                FX Rate
              </span>
              <div className="flex items-center gap-1.5">
                {Object.entries(FX_RATES).map(([currency, data]) => (
                  <div 
                    key={currency}
                    className="flex items-center gap-1 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm hover:shadow-md transition-shadow"
                    title={`1 ${currency} = ${data.rate} JPY`}
                  >
                    <span className="text-base">{data.flag}</span>
                    <span className="text-xs font-bold text-slate-700">{data.rate.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                <RefreshCw className="w-3 h-3" />
                <span>02/25</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 md:p-6">
            <PriceTable />
          </div>
        </div>
      </div>

      {/* Footer - 更简洁 */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold text-white mb-1">ノーヴァテック株式会社</p>
          <p className="text-sm text-blue-400 mb-3">AI予測でiPhone売却最適化</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">© 2026 NOVA買取サイト All rights reserved.</p>
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