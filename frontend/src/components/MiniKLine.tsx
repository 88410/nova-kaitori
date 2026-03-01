import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

interface KLineData {
  date: string
  open: number
  high: number
  low: number
  close: number
  best_store?: string
}

interface MiniKLineProps {
  productId: number
  days?: number
  width?: number
  height?: number
}

// 简化的K线迷你图组件
export default function MiniKLine({ productId, days = 7, width = 80, height = 30 }: MiniKLineProps) {
  const [hoverData, setHoverData] = useState<KLineData | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const { data: klineData, isLoading } = useQuery<KLineData[]>({
    queryKey: ['kline', productId, days],
    queryFn: async () => {
      return apiGet(`/prices/kline/${productId}?days=${days}`)
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })

  if (isLoading || !klineData || klineData.length === 0) {
    return <div className="bg-slate-100 rounded" style={{ width, height }} />
  }

  // 计算价格范围
  const prices = klineData.flatMap(d => [d.open, d.high, d.low, d.close])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  // 每个蜡烛的宽度
  const candleWidth = Math.max(2, (width - 4) / klineData.length)
  const gap = 1

  // 价格转Y坐标
  const priceToY = (price: number) => {
    return height - 2 - ((price - minPrice) / priceRange) * (height - 4)
  }

  const handleMouseMove = (e: React.MouseEvent, data: KLineData) => {
    setHoverData(data)
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoverData(null)
  }

  return (
    <>
      <svg 
        width={width} 
        height={height} 
        className="cursor-pointer"
        onMouseLeave={handleMouseLeave}
      >
        {/* 背景网格线 */}
        <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="#e2e8f0" strokeWidth={0.5} />
        
        {klineData.map((data, index) => {
          const x = index * (candleWidth + gap) + 2
          const isUp = data.close >= data.open
          const color = isUp ? '#22c55e' : '#ef4444' // 绿色涨，红色跌
          
          const yOpen = priceToY(data.open)
          const yClose = priceToY(data.close)
          const yHigh = priceToY(data.high)
          const yLow = priceToY(data.low)
          
          const bodyTop = Math.min(yOpen, yClose)
          const bodyHeight = Math.max(1, Math.abs(yClose - yOpen))
          
          return (
            <g 
              key={data.date}
              onMouseEnter={(e) => handleMouseMove(e, data)}
              onMouseMove={(e) => handleMouseMove(e, data)}
            >
              {/* 影线（高低点） */}
              <line
                x1={x + candleWidth / 2}
                y1={yHigh}
                x2={x + candleWidth / 2}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              {/* 实体（开盘收盘） */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx={0.5}
              />
            </g>
          )
        })}
      </svg>

      {/* 悬停提示框 */}
      {hoverData && (
        <div
          className="fixed z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 60,
          }}
        >
          <div className="font-medium mb-1">{hoverData.date}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-300">
            <span>開:</span><span className="text-right">¥{hoverData.open.toLocaleString()}</span>
            <span>高:</span><span className="text-right">¥{hoverData.high.toLocaleString()}</span>
            <span>低:</span><span className="text-right">¥{hoverData.low.toLocaleString()}</span>
            <span>終:</span><span className="text-right">¥{hoverData.close.toLocaleString()}</span>
          </div>
          {hoverData.best_store && (
            <div className="mt-1 pt-1 border-t border-slate-700 text-emerald-400">
              {hoverData.best_store}
            </div>
          )}
        </div>
      )}
    </>
  )
}
