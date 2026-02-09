import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div className="max-w-2xl mx-auto relative px-2 md:px-0">
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
        <input
          type="text"
          placeholder="機種名・容量で検索 (例: iPhone 17 Pro Max)"
          className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  )
}
