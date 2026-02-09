import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-1.5 md:space-x-2">
          <div className="bg-blue-600 text-white font-bold text-base md:text-xl px-2 md:px-3 py-0.5 md:py-1 rounded-lg">
            NOVA
          </div>
          <span className="text-gray-700 font-medium text-sm md:text-base">買取サイト</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            トップ
          </Link>
          <a href="#" className="hover:text-blue-600 transition-colors">
            ランキング
          </a>
          <a href="#" className="hover:text-blue-600 transition-colors">
            価格推移
          </a>
        </div>
      </div>
    </nav>
  )
}
