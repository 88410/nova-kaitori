import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { Language } from '../i18n'

type Interval = '1h' | '1d' | '1w'

interface Candle {
  time: string
  label: string
  open: number
  high: number
  low: number
  close: number
  best_store: string | null
  sample_count: number
  store_count: number
}

interface StorePoint {
  time: string
  label: string
  price: number
}

interface StoreSeries {
  store_id: number
  store_name: string
  latest_price: number
  points: StorePoint[]
}

interface IndicatorPoint {
  time: string
  value: number
}

interface AdvancedKLineResponse {
  product_id: number
  interval: Interval
  days: number
  candles: Candle[]
  store_series: StoreSeries[]
  indicators: {
    sma7: IndicatorPoint[]
    sma25: IndicatorPoint[]
    bb_upper: IndicatorPoint[]
    bb_lower: IndicatorPoint[]
    rsi14: IndicatorPoint[]
    macd: IndicatorPoint[]
    macd_signal: IndicatorPoint[]
    macd_histogram: IndicatorPoint[]
  }
  summary: {
    latest_close: number | null
    change: number
    change_percent: number
    high: number | null
    low: number | null
    store_count: number
    sample_count: number
    data_points: number
    filtered_points: number
  }
}

interface ProfessionalKLineChartProps {
  productId: number
  language: Language
}

const INTERVAL_DEFAULT_DAYS: Record<Interval, number> = {
  '1h': 7,
  '1d': 60,
  '1w': 180,
}

const RANGE_OPTIONS: Record<Interval, number[]> = {
  '1h': [7, 14, 30],
  '1d': [30, 60, 90, 180],
  '1w': [90, 180, 365],
}

const STORE_COLORS = [
  '#38bdf8',
  '#f97316',
  '#a78bfa',
  '#22c55e',
  '#f43f5e',
  '#eab308',
  '#14b8a6',
  '#fb7185',
  '#60a5fa',
  '#c084fc',
  '#84cc16',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#10b981',
  '#818cf8',
  '#facc15',
  '#2dd4bf',
  '#fb923c',
  '#93c5fd',
  '#d946ef',
  '#4ade80',
  '#f87171',
  '#67e8f9',
]

const TEXT: Record<Language, Record<string, string>> = {
  ja: {
    title: 'プロ仕様 価格K線',
    subtitle: '商品全体の価格推移と店舗別ラインを同一チャートで表示',
    intervalHour: '1時間',
    intervalDay: '日足',
    intervalWeek: '週足',
    storeLines: '店舗ライン',
    movingAverage: 'SMA',
    bollinger: 'BB',
    latest: '現在値',
    change: '変動',
    high: '高値',
    low: '安値',
    stores: '店舗',
    points: 'データ',
    loading: '読み込み中...',
    noData: '履歴データがありません',
    open: '始値',
    close: '終値',
    bestStore: '最高値店舗',
    samples: '取得数',
    indicators: 'テクニカル指標',
    aggregate: '全店舗集計K線',
  },
  zh: {
    title: '专业价格K线',
    subtitle: '商品整体价格与各店铺价格线同屏显示',
    intervalHour: '小时K',
    intervalDay: '日K',
    intervalWeek: '周K',
    storeLines: '店铺线',
    movingAverage: 'SMA',
    bollinger: 'BB',
    latest: '当前价',
    change: '变动',
    high: '高点',
    low: '低点',
    stores: '店铺',
    points: '数据',
    loading: '载入中...',
    noData: '没有历史数据',
    open: '开盘',
    close: '收盘',
    bestStore: '最高价店铺',
    samples: '采样',
    indicators: '技术指标',
    aggregate: '全店铺聚合K线',
  },
  en: {
    title: 'Professional Price K-Line',
    subtitle: 'Aggregate product candles and store lines on one chart',
    intervalHour: '1H',
    intervalDay: '1D',
    intervalWeek: '1W',
    storeLines: 'Store Lines',
    movingAverage: 'SMA',
    bollinger: 'BB',
    latest: 'Latest',
    change: 'Change',
    high: 'High',
    low: 'Low',
    stores: 'Stores',
    points: 'Points',
    loading: 'Loading...',
    noData: 'No history data',
    open: 'Open',
    close: 'Close',
    bestStore: 'Best store',
    samples: 'Samples',
    indicators: 'Indicators',
    aggregate: 'Aggregate candles',
  },
}

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `¥${Math.round(value).toLocaleString()}`
}

function formatCompactPrice(value: number) {
  return `¥${Math.round(value / 1000)}k`
}

function formatChange(value: number, percent: number) {
  if (!value) return '0'
  const sign = value > 0 ? '+' : '-'
  return `${sign}¥${Math.abs(Math.round(value)).toLocaleString()} (${sign}${Math.abs(percent).toFixed(2)}%)`
}

function pathFromPoints(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
}

function valueMap(points: IndicatorPoint[] | undefined) {
  return new Map((points ?? []).map((point) => [point.time, point.value]))
}

export default function ProfessionalKLineChart({ productId, language }: ProfessionalKLineChartProps) {
  const labels = TEXT[language] ?? TEXT.ja
  const [interval, setInterval] = useState<Interval>('1d')
  const [days, setDays] = useState(INTERVAL_DEFAULT_DAYS['1d'])
  const [showStores, setShowStores] = useState(true)
  const [showAverage, setShowAverage] = useState(true)
  const [showBollinger, setShowBollinger] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const chartScrollerRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading } = useQuery<AdvancedKLineResponse>({
    queryKey: ['price-kline-advanced', productId, interval, days],
    queryFn: async () => {
      return apiGet<AdvancedKLineResponse>(`/api/v1/prices/kline-advanced/${productId}`, {
        params: { interval, days },
      })
    },
    staleTime: 1000 * 60 * 5,
  })

  const chart = useMemo(() => {
    const candles = data?.candles ?? []
    if (candles.length === 0) return null

    const left = 58
    const right = 64
    const top = 28
    const mainHeight = 314
    const indicatorGap = 34
    const rsiTop = top + mainHeight + indicatorGap
    const indicatorHeight = 72
    const macdTop = rsiTop + indicatorHeight + 34
    const width = 1120 - left - right
    const timeToIndex = new Map(candles.map((candle, index) => [candle.time, index]))
    const xForIndex = (index: number) => {
      if (candles.length === 1) return left + width / 2
      return left + (index / (candles.length - 1)) * width
    }

    const priceValues = [
      ...candles.flatMap((candle) => [candle.high, candle.low, candle.open, candle.close]),
      ...(data?.store_series ?? []).flatMap((series) => series.points.map((point) => point.price)),
      ...(data?.indicators.sma7 ?? []).map((point) => point.value),
      ...(data?.indicators.sma25 ?? []).map((point) => point.value),
      ...(data?.indicators.bb_upper ?? []).map((point) => point.value),
      ...(data?.indicators.bb_lower ?? []).map((point) => point.value),
    ].filter((value) => Number.isFinite(value))

    const rawMin = Math.min(...priceValues)
    const rawMax = Math.max(...priceValues)
    const padding = Math.max((rawMax - rawMin) * 0.12, 5000)
    const min = rawMin - padding
    const max = rawMax + padding
    const priceToY = (price: number) => top + ((max - price) / (max - min || 1)) * mainHeight

    const sma7Map = valueMap(data?.indicators.sma7)
    const sma25Map = valueMap(data?.indicators.sma25)
    const bbUpperMap = valueMap(data?.indicators.bb_upper)
    const bbLowerMap = valueMap(data?.indicators.bb_lower)
    const rsiMap = valueMap(data?.indicators.rsi14)
    const macdMap = valueMap(data?.indicators.macd)
    const macdSignalMap = valueMap(data?.indicators.macd_signal)
    const macdHistogramMap = valueMap(data?.indicators.macd_histogram)

    const lineForIndicator = (map: Map<string, number>, yForValue: (value: number) => number) =>
      candles
        .map((candle, index) => {
          const value = map.get(candle.time)
          if (value === undefined) return null
          return { x: xForIndex(index), y: yForValue(value) }
        })
        .filter((point): point is { x: number; y: number } => point !== null)

    const storeLines = (data?.store_series ?? []).map((series, index) => ({
      series,
      color: STORE_COLORS[index % STORE_COLORS.length],
      points: series.points
        .map((point) => {
          const candleIndex = timeToIndex.get(point.time)
          if (candleIndex === undefined) return null
          return { x: xForIndex(candleIndex), y: priceToY(point.price) }
        })
        .filter((point): point is { x: number; y: number } => point !== null),
    }))

    const rsiToY = (value: number) => rsiTop + ((100 - value) / 100) * indicatorHeight
    const macdValues = [
      ...(data?.indicators.macd ?? []).map((point) => point.value),
      ...(data?.indicators.macd_signal ?? []).map((point) => point.value),
      ...(data?.indicators.macd_histogram ?? []).map((point) => point.value),
    ]
    const macdMaxAbs = Math.max(...macdValues.map((value) => Math.abs(value)), 1)
    const macdZeroY = macdTop + indicatorHeight / 2
    const macdToY = (value: number) => macdZeroY - (value / macdMaxAbs) * (indicatorHeight / 2 - 6)
    const candleWidth = Math.max(4, Math.min(16, (width / Math.max(candles.length, 1)) * 0.48))

    return {
      candles,
      left,
      width,
      top,
      mainHeight,
      rsiTop,
      macdTop,
      indicatorHeight,
      min,
      max,
      priceToY,
      xForIndex,
      candleWidth,
      storeLines,
      sma7: lineForIndicator(sma7Map, priceToY),
      sma25: lineForIndicator(sma25Map, priceToY),
      bbUpper: lineForIndicator(bbUpperMap, priceToY),
      bbLower: lineForIndicator(bbLowerMap, priceToY),
      rsi: lineForIndicator(rsiMap, rsiToY),
      macd: lineForIndicator(macdMap, macdToY),
      macdSignal: lineForIndicator(macdSignalMap, macdToY),
      macdHistogramMap,
      macdZeroY,
      macdToY,
      rsiToY,
      timeToIndex,
    }
  }, [data])

  useEffect(() => {
    const scroller = chartScrollerRef.current
    if (!scroller) return
    scroller.scrollLeft = scroller.scrollWidth
  }, [data?.candles.length, days, interval])

  const setActiveInterval = (nextInterval: Interval) => {
    setInterval(nextInterval)
    setDays(INTERVAL_DEFAULT_DAYS[nextInterval])
    setHoverIndex(null)
  }

  const updateHover = (clientX: number, target: SVGRectElement) => {
    if (!chart) return
    const rect = target.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 1120
    const ratio = (x - chart.left) / chart.width
    const nextIndex = Math.round(ratio * (chart.candles.length - 1))
    setHoverIndex(Math.max(0, Math.min(chart.candles.length - 1, nextIndex)))
  }

  if (isLoading || data === undefined) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg bg-slate-950 text-slate-300">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
        <span>{labels.loading}</span>
      </div>
    )
  }

  if (!chart) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg bg-slate-950 text-slate-400">
        {labels.noData}
      </div>
    )
  }

  const activeIndex = hoverIndex ?? chart.candles.length - 1
  const activeCandle = chart.candles[activeIndex]
  const activeX = chart.xForIndex(activeIndex)
  const tooltipX = activeX > 760 ? 86 : 748
  const tooltipY = 44
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  const rsiGuide = [70, 50, 30]
  const activeChangeClass =
    data.summary.change > 0 ? 'text-emerald-400' : data.summary.change < 0 ? 'text-red-400' : 'text-slate-300'

  return (
    <div className="overflow-hidden rounded-lg bg-slate-950 text-white">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sky-300">{labels.title}</p>
          <p className="mt-1 break-words text-xs text-slate-400">{labels.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([
            ['1h', labels.intervalHour],
            ['1d', labels.intervalDay],
            ['1w', labels.intervalWeek],
          ] as Array<[Interval, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveInterval(value)}
              className={cx(
                'rounded border px-3 py-1.5 text-xs font-medium transition-colors',
                interval === value
                  ? 'border-sky-400 bg-sky-400 text-slate-950'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
              )}
            >
              {label}
            </button>
          ))}
          {RANGE_OPTIONS[interval].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDays(value)
                setHoverIndex(null)
              }}
              className={cx(
                'rounded border px-2.5 py-1.5 text-xs font-medium transition-colors',
                days === value
                  ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
              )}
            >
              {value}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-800 px-4 py-3 sm:grid-cols-5">
        <Metric label={labels.latest} value={formatPrice(data.summary.latest_close)} />
        <Metric label={labels.change} value={formatChange(data.summary.change, data.summary.change_percent)} valueClass={activeChangeClass} />
        <Metric label={labels.high} value={formatPrice(data.summary.high)} />
        <Metric label={labels.low} value={formatPrice(data.summary.low)} />
        <Metric label={labels.stores} value={`${data.summary.store_count}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        <ToggleButton active={showStores} onClick={() => setShowStores((value) => !value)} label={labels.storeLines} />
        <ToggleButton active={showAverage} onClick={() => setShowAverage((value) => !value)} label={labels.movingAverage} />
        <ToggleButton active={showBollinger} onClick={() => setShowBollinger((value) => !value)} label={labels.bollinger} />
        <span className="ml-auto text-xs text-slate-500">
          {labels.points}: {data.summary.data_points} / {labels.samples}: {data.summary.sample_count}
        </span>
      </div>

      <div ref={chartScrollerRef} className="overflow-x-auto px-2 pb-4 pt-2 sm:px-4">
        <svg
          className="block h-[560px] w-[980px] max-w-none touch-pan-y select-none sm:h-[620px] sm:w-full"
          viewBox="0 0 1120 620"
          preserveAspectRatio="none"
          role="img"
          aria-label={labels.title}
        >
          <rect x="0" y="0" width="1120" height="620" fill="#020617" />

          {gridLines.map((line) => {
            const y = chart.top + line * chart.mainHeight
            const value = chart.max - line * (chart.max - chart.min)
            return (
              <g key={`main-grid-${line}`}>
                <line x1={chart.left} x2={chart.left + chart.width} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x="1070" y={y + 4} fill="#94a3b8" fontSize="12" textAnchor="end">
                  {formatCompactPrice(value)}
                </text>
              </g>
            )
          })}

          {chart.candles.map((candle, index) => {
            const x = chart.xForIndex(index)
            const openY = chart.priceToY(candle.open)
            const closeY = chart.priceToY(candle.close)
            const highY = chart.priceToY(candle.high)
            const lowY = chart.priceToY(candle.low)
            const isUp = candle.close >= candle.open
            const color = isUp ? '#22c55e' : '#ef4444'
            const bodyY = Math.min(openY, closeY)
            const bodyHeight = Math.max(Math.abs(openY - closeY), 2)
            return (
              <g key={candle.time}>
                <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="1.5" />
                <rect
                  x={x - chart.candleWidth / 2}
                  y={bodyY}
                  width={chart.candleWidth}
                  height={bodyHeight}
                  rx="1"
                  fill={isUp ? '#16a34a' : '#dc2626'}
                  stroke={color}
                  strokeWidth="1"
                />
              </g>
            )
          })}

          {showStores &&
            chart.storeLines.map((line) =>
              line.points.length >= 2 ? (
                <polyline
                  key={line.series.store_id}
                  points={pathFromPoints(line.points)}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="1.4"
                  strokeOpacity="0.56"
                />
              ) : null,
            )}

          {showBollinger && chart.bbUpper.length >= 2 && (
            <polyline points={pathFromPoints(chart.bbUpper)} fill="none" stroke="#64748b" strokeDasharray="5 5" strokeWidth="1.2" />
          )}
          {showBollinger && chart.bbLower.length >= 2 && (
            <polyline points={pathFromPoints(chart.bbLower)} fill="none" stroke="#64748b" strokeDasharray="5 5" strokeWidth="1.2" />
          )}
          {showAverage && chart.sma7.length >= 2 && (
            <polyline points={pathFromPoints(chart.sma7)} fill="none" stroke="#facc15" strokeWidth="2" />
          )}
          {showAverage && chart.sma25.length >= 2 && (
            <polyline points={pathFromPoints(chart.sma25)} fill="none" stroke="#38bdf8" strokeWidth="2" />
          )}

          <text x={chart.left} y={18} fill="#cbd5e1" fontSize="13" fontWeight="600">
            {labels.aggregate}
          </text>
          <text x={chart.left} y={chart.rsiTop - 12} fill="#cbd5e1" fontSize="13" fontWeight="600">
            RSI 14
          </text>
          <text x={chart.left} y={chart.macdTop - 12} fill="#cbd5e1" fontSize="13" fontWeight="600">
            MACD
          </text>

          {rsiGuide.map((value) => {
            const y = chart.rsiToY(value)
            return (
              <g key={`rsi-${value}`}>
                <line x1={chart.left} x2={chart.left + chart.width} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x="1070" y={y + 4} fill="#64748b" fontSize="11" textAnchor="end">
                  {value}
                </text>
              </g>
            )
          })}
          {chart.rsi.length >= 2 && <polyline points={pathFromPoints(chart.rsi)} fill="none" stroke="#a78bfa" strokeWidth="1.8" />}

          <line x1={chart.left} x2={chart.left + chart.width} y1={chart.macdZeroY} y2={chart.macdZeroY} stroke="#334155" strokeWidth="1" />
          {chart.candles.map((candle, index) => {
            const value = chart.macdHistogramMap.get(candle.time)
            if (value === undefined) return null
            const x = chart.xForIndex(index)
            const y = value >= 0 ? chart.macdToY(value) : chart.macdZeroY
            const height = Math.abs(chart.macdToY(value) - chart.macdZeroY)
            return (
              <rect
                key={`macd-h-${candle.time}`}
                x={x - chart.candleWidth / 2}
                y={y}
                width={chart.candleWidth}
                height={Math.max(height, 1)}
                fill={value >= 0 ? '#22c55e' : '#ef4444'}
                opacity="0.55"
              />
            )
          })}
          {chart.macd.length >= 2 && <polyline points={pathFromPoints(chart.macd)} fill="none" stroke="#38bdf8" strokeWidth="1.7" />}
          {chart.macdSignal.length >= 2 && <polyline points={pathFromPoints(chart.macdSignal)} fill="none" stroke="#f97316" strokeWidth="1.7" />}

          {chart.candles.map((candle, index) => {
            if (index % Math.max(1, Math.ceil(chart.candles.length / 6)) !== 0 && index !== chart.candles.length - 1) return null
            return (
              <text key={`x-${candle.time}`} x={chart.xForIndex(index)} y="606" fill="#64748b" fontSize="11" textAnchor="middle">
                {candle.label}
              </text>
            )
          })}

          <line x1={activeX} x2={activeX} y1={chart.top} y2={chart.macdTop + chart.indicatorHeight} stroke="#e2e8f0" strokeDasharray="4 6" strokeOpacity="0.55" />
          <circle cx={activeX} cy={chart.priceToY(activeCandle.close)} r="4" fill="#f8fafc" stroke="#0ea5e9" strokeWidth="2" />
          <rect x={tooltipX} y={tooltipY} width="286" height="166" rx="6" fill="#0f172a" stroke="#334155" />
          <text x={tooltipX + 14} y={tooltipY + 24} fill="#f8fafc" fontSize="13" fontWeight="600">
            {activeCandle.label}
          </text>
          <text x={tooltipX + 14} y={tooltipY + 48} fill="#94a3b8" fontSize="12">
            O {formatPrice(activeCandle.open)}  H {formatPrice(activeCandle.high)}
          </text>
          <text x={tooltipX + 14} y={tooltipY + 70} fill="#94a3b8" fontSize="12">
            L {formatPrice(activeCandle.low)}  C {formatPrice(activeCandle.close)}
          </text>
          <text x={tooltipX + 14} y={tooltipY + 94} fill="#cbd5e1" fontSize="12">
            {labels.bestStore}: {activeCandle.best_store ?? '-'}
          </text>
          <text x={tooltipX + 14} y={tooltipY + 118} fill="#94a3b8" fontSize="12">
            {labels.stores}: {activeCandle.store_count} / {labels.samples}: {activeCandle.sample_count}
          </text>
          <text x={tooltipX + 14} y={tooltipY + 142} fill="#64748b" fontSize="11">
            {labels.indicators}: SMA7 / SMA25 / BB / RSI / MACD
          </text>

          <rect
            x={chart.left}
            y="0"
            width={chart.width}
            height="620"
            fill="transparent"
            pointerEvents="all"
            onMouseMove={(event) => updateHover(event.clientX, event.currentTarget)}
            onMouseLeave={() => setHoverIndex(null)}
            onTouchMove={(event) => {
              const touch = event.touches[0]
              if (touch) updateHover(touch.clientX, event.currentTarget)
            }}
          />
        </svg>
      </div>

      {data.store_series.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-t border-slate-800 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {data.store_series.map((series, index) => (
              <div key={series.store_id} className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STORE_COLORS[index % STORE_COLORS.length] }}
                />
                <span className="max-w-[9rem] truncate">{series.store_name}</span>
                <span className="font-medium text-slate-100">{formatPrice(series.latest_price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-slate-200 bg-slate-200 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
      )}
    >
      {label}
    </button>
  )
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0 rounded border border-slate-800 bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cx('mt-1 truncate text-sm font-semibold text-slate-100 sm:text-base', valueClass)}>{value}</p>
    </div>
  )
}
