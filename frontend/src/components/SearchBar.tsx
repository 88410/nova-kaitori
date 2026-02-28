import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div className="relative max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 md:left-4 md:h-5 md:w-5" />
        <input
          type="text"
          placeholder="機種名・容量で検索 (例: iPhone 17 Pro Max)"
          className="w-full rounded-md border border-slate-300 px-3 py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none md:pl-12 md:text-base"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  )
}
