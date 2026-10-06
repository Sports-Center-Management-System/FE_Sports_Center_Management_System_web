import { useId, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import {
  formatMeasurementDate,
  formatMetric,
  inbodyMetrics,
  type Measurement,
  type MetricKey,
} from './inbody-data'
import { InbodyVisualBoundary } from './inbody-visual-boundary'

export default function InbodyProgressChart({ measurements }: { measurements: Measurement[] }) {
  const [metricKey, setMetricKey] = useState<MetricKey>('weightKg')
  const metric = inbodyMetrics.find((item) => item.key === metricKey)!
  const selectId = useId()
  const descriptionId = useId()
  const data = measurements.map((item) => ({ timestamp: item.timestamp!, value: item[metricKey] }))
  const available = data.filter((item) => item.value !== null)
  const summary =
    available.length === 0
      ? `Chưa có dữ liệu ${metric.label.toLowerCase()} để hiển thị biểu đồ.`
      : `${metric.label}: ${available.length} lần đo có dữ liệu, từ ${formatMetric(available[0].value, metric.unit)} đến ${formatMetric(available.at(-1)!.value, metric.unit)}. Xem từng lần đo trong bảng lịch sử bên dưới.`
  return (
    <Card
      role="region"
      aria-label="Sơ đồ quá trình cải thiện"
      className="inbody-visual-card flex flex-col"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Sơ đồ quá trình cải thiện
          </h2>
          <p className="mb-0 mt-2 text-xs text-slate-500">
            Theo từng lần đo · {metric.label}
            {metric.unit ? ` (${metric.unit})` : ''}
          </p>
        </div>
        <div className="min-w-0 max-w-full">
          <label htmlFor={selectId} className="sr-only">
            Chọn chỉ số theo dõi
          </label>
          <select
            id={selectId}
            value={metricKey}
            onChange={(event) => setMetricKey(event.target.value as MetricKey)}
            className="w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008b74]"
          >
            {inbodyMetrics.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p id={descriptionId} className="sr-only" aria-live="polite">
        {summary}
      </p>
      {available.length > 0 ? (
        <InbodyVisualBoundary
          key={metricKey}
          fallback={
            <p role="status" className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
              Không thể hiển thị biểu đồ. {summary}
            </p>
          }
        >
          <div
            className="inbody-chart-plot"
            aria-label={`Biểu đồ ${metric.label.toLowerCase()} theo ngày đo`}
            aria-describedby={descriptionId}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={data}
                accessibilityLayer
                margin={{ top: 16, right: 12, left: 0, bottom: 16 }}
              >
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value: number) => formatMeasurementDate(value)}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  width={52}
                  domain={['auto', 'auto']}
                  tickFormatter={(value: number) => formatMetric(value)}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  labelFormatter={(value) => formatMeasurementDate(Number(value))}
                  formatter={(value) => [
                    formatMetric(typeof value === 'number' ? value : null, metric.unit),
                    metric.label,
                  ]}
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  name={metric.label}
                  stroke="#008b74"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </InbodyVisualBoundary>
      ) : (
        <p className="inbody-chart-plot mb-0 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm leading-relaxed text-slate-500">
          {summary}
        </p>
      )}
      {available.length === 1 && (
        <p className="mb-0 mt-3 text-xs text-slate-500">Cần thêm lần đo để xem xu hướng.</p>
      )}
    </Card>
  )
}
