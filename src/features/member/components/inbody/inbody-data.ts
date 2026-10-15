import { Activity, Dumbbell, Scale, Droplets } from 'lucide-react'
import { vietnamDate } from '@/lib/date'
import type { InbodyLog } from '@/lib/types'

export type MetricKey = 'weightKg' | 'bodyFatPct' | 'muscleMassKg' | 'bmi'
export interface InbodyMetric {
  key: MetricKey
  label: string
  unit: string
  deltaUnit: string
  icon: typeof Activity
}
export type Measurement = Record<MetricKey, number | null> & {
  key: string
  timestamp: number | null
}
export const inbodyMetrics: InbodyMetric[] = [
  { key: 'weightKg', label: 'Cân nặng', unit: 'kg', deltaUnit: 'kg', icon: Scale },
  { key: 'bodyFatPct', label: 'Mỡ cơ thể', unit: '%', deltaUnit: 'điểm %', icon: Droplets },
  { key: 'muscleMassKg', label: 'Khối lượng cơ', unit: 'kg', deltaUnit: 'kg', icon: Dumbbell },
  { key: 'bmi', label: 'BMI', unit: '', deltaUnit: '', icon: Activity },
]

export function metricNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// Preserve object records in history; only dated records establish first/latest and trends.
export function prepareMeasurements(logs: InbodyLog[] | undefined) {
  const measurements: Measurement[] = !Array.isArray(logs)
    ? []
    : logs.flatMap((log, index) => {
        if (!log || typeof log !== 'object') return []
        const time =
          typeof log.measuredAt === 'string' && log.measuredAt.trim()
            ? Date.parse(log.measuredAt)
            : NaN
        return [
          {
            key: `${typeof log.id === 'string' ? log.id : 'measurement'}-${index}`,
            timestamp: Number.isFinite(time) ? time : null,
            weightKg: metricNumber(log.weightKg),
            bodyFatPct: metricNumber(log.bodyFatPct),
            muscleMassKg: metricNumber(log.muscleMassKg),
            bmi: metricNumber(log.bmi),
          },
        ]
      })
  const chronological = measurements
    .filter((item) => item.timestamp !== null)
    .sort((a, b) => a.timestamp! - b.timestamp!)
  const undated = measurements.filter((item) => item.timestamp === null)
  return {
    chronological,
    history: [...chronological].reverse().concat(undated),
    undatedCount: undated.length,
  }
}

const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
export function formatMetric(value: number | null, unit = '') {
  return value === null ? '—' : `${numberFormat.format(value)}${unit ? ` ${unit}` : ''}`
}
export function formatDelta(current: number | null, previous: number | null, unit = '') {
  if (current === null || previous === null) return 'Chưa đủ dữ liệu'
  const difference = Math.round((current - previous) * 100) / 100
  if (!Number.isFinite(difference)) return 'Chưa đủ dữ liệu'
  if (difference === 0) return 'Không đổi'
  return `${difference > 0 ? '+' : '−'}${formatMetric(Math.abs(difference), unit)}`
}
export function formatMeasurementDate(timestamp: number | null) {
  return timestamp === null
    ? 'Chưa có ngày đo hợp lệ'
    : vietnamDate(new Date(timestamp).toISOString())
}
