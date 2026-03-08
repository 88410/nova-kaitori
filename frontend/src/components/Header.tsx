import { Link } from 'react-router-dom'
import AIChat from './AIChat'

export default function Header() {
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center space-x-1.5 md:space-x-2">
          <div className="rounded border border-slate-900 px-2 py-0.5 text-base font-semibold text-slate-900 md:text-lg">
            NOVA
          </div>
          <span className="text-sm font-medium text-slate-700 md:text-base">買取サイト</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center space-x-6 text-sm text-slate-600 md:flex">
            <Link to="/" className="transition-colors hover:text-slate-900">
              トップ
            </Link>
            <a href="#" className="transition-colors hover:text-slate-900">
              ランキング
            </a>
            <a href="#" className="transition-colors hover:text-slate-900">
              価格推移
            </a>
          </div>
          
          {/* NOVA GPT */}
          <AIChat />
        </div>
      </div>
    </nav>
  )
}
