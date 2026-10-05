import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  formatDelta,
  formatMeasurementDate,
  formatMetric,
  inbodyMetrics,
  type Measurement,
} from './inbody-data'

export function InbodyComparison({ first, current }: { first: Measurement; current: Measurement }) {
  return (
    <Card className="p-6">
      <h2 className="font-bold text-slate-900">
        Lần đo đầu tiên <span className="font-normal text-slate-400">vs</span> Hiện tại
      </h2>
      <p className="mb-6 mt-2 text-xs text-slate-500">
        {formatMeasurementDate(first.timestamp)} → {formatMeasurementDate(current.timestamp)}
      </p>
      <div className="grid grid-cols-4 gap-5">
        {inbodyMetrics.map((metric) => (
          <div key={metric.key} className="min-w-0 border-l-2 border-slate-100 pl-4">
            <h3 className="mb-3 text-xs font-semibold text-slate-500">{metric.label}</h3>
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{formatMetric(first[metric.key], metric.unit)}</span>
              <ArrowRight className="h-3 w-3 text-slate-400" aria-label="đến" />
              <span className="font-semibold text-slate-900">
                {formatMetric(current[metric.key], metric.unit)}
              </span>
            </p>
            <p className="mb-0 text-lg font-semibold text-slate-800">
              {formatDelta(current[metric.key], first[metric.key], metric.deltaUnit)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
