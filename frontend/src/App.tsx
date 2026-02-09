import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import PriceTable from './components/PriceTable'
import ProductDetail from './pages/ProductDetail'
import Stats from './components/Stats'

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
          <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              買取価格一覧
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              全国主要買取店の価格をリアルタイムで比較
            </p>
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
