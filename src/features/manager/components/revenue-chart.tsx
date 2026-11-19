import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { money } from '@/lib/api'
import { formatDay } from '../lib/format'

export interface DayRevenue {
  /** YYYY-MM-DD in Vietnam time. */
  day: string
  base: number
  pt: number
  invoices: number
  /** False for days older than the oldest invoice the API returned. */
  complete: boolean
}

/** Format currency ticks into Vietnamese compact form: 500k, 1,2 tr, 10 tr */
function compactVnd(value: number): string {
  if (value >= 1e6) {
    const tr = value / 1e6
    return `${Number(tr.toFixed(1)).toLocaleString('vi-VN')} tr`
  }
  if (value >= 1e3) {
    return `${Math.round(value / 1e3)}k`
  }
  return String(value)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const item: DayRevenue = payload[0]?.payload
  if (!item) return null

  const total = item.base + item.pt

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md min-w-[200px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <span className="text-xs font-bold text-slate-800">{formatDay(item.day)}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {item.invoices} hóa đơn
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#008b74]" />
            Gói cơ bản:
          </span>
          <span className="font-bold tabular-nums text-slate-900">{money(item.base)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" />
            Kèm PT 1:1:
          </span>
          <span className="font-bold tabular-nums text-slate-900">{money(item.pt)}</span>
        </div>

        <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex items-center justify-between">
          <span className="font-bold text-slate-800">Tổng doanh thu:</span>
          <span className="font-black text-sm text-[#008b74] tabular-nums font-mono">
            {money(total)}
          </span>
        </div>

        {!item.complete && (
          <p className="text-[10px] text-amber-600 pt-1 italic font-medium">
            * Dữ liệu có thể thiếu do chạm giới hạn lưu trữ
          </p>
        )}
      </div>
    </div>
  )
}

export function RevenueChart({ data }: { data: DayRevenue[] }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      shortDay: d.day.slice(5), // MM-DD
      total: d.base + d.pt,
    }))
  }, [data])

  const maxVal = useMemo(() => {
    return Math.max(...data.map((d) => d.base + d.pt), 1000000)
  }, [data])

  return (
    <div className="w-full">
      {/* Legend Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#008b74]" />
            Gói tập hội viên
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#f97316]" />
            Buổi tập kèm PT
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, bottom: 8, left: 8 }}
          >
            <defs>
              <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#008b74" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#008b74" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="colorPt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="areaTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#008b74" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#008b74" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="shortDay"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval="preserveStartEnd"
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={compactVnd}
              domain={[0, Math.ceil(maxVal * 1.15)]}
              width={56}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="total"
              stroke="#008b74"
              strokeWidth={1.5}
              fill="url(#areaTotal)"
              dot={false}
              activeDot={{ r: 4, fill: '#008b74', stroke: '#ffffff', strokeWidth: 2 }}
            />

            <Bar
              dataKey="base"
              stackId="a"
              fill="url(#colorBase)"
              radius={[0, 0, 0, 0]}
              maxBarSize={28}
            />

            <Bar
              dataKey="pt"
              stackId="a"
              fill="url(#colorPt)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default RevenueChart
