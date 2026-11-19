import { INBODY_LIMITS, SEGMENTS, SEGMENT_NAME, deriveInbody, type DerivedInbody } from './inbody'
import type { InbodySegment } from './types'

/**
 * Form model for the InBody entry forms (front desk and coach). Quick mode takes the four
 * readings a desk needs; pro mode adds the rest of the InBody sheet and the five segments.
 */

export type EntryMode = 'quick' | 'pro'

type QuickKey = 'heightCm' | 'weightKg' | 'skeletalMuscleMassKg' | 'bodyFatPct'
type ProKey =
  'tbwLiters' | 'proteinKg' | 'mineralKg' | 'visceralFatLevel' | 'waistHipRatio' | 'inbodyScore'
export type EntryField = QuickKey | ProKey | InbodySegment

export interface FieldSpec {
  key: EntryField
  label: string
  unit: string
  min: number
  max: number
  integer?: boolean
  placeholder?: string
}

export const QUICK_FIELDS: FieldSpec[] = [
  {
    key: 'heightCm',
    label: 'Chiều cao',
    unit: 'cm',
    ...INBODY_LIMITS.heightCm,
    placeholder: '170',
  },
  { key: 'weightKg', label: 'Cân nặng', unit: 'kg', ...INBODY_LIMITS.weightKg, placeholder: '65' },
  {
    key: 'skeletalMuscleMassKg',
    label: 'Cơ xương (SMM)',
    unit: 'kg',
    ...INBODY_LIMITS.skeletalMuscleMassKg,
    placeholder: '29.5',
  },
  {
    key: 'bodyFatPct',
    label: 'Tỷ lệ mỡ (PBF)',
    unit: '%',
    ...INBODY_LIMITS.bodyFatPct,
    placeholder: '20',
  },
]

export const PRO_FIELDS: FieldSpec[] = [
  { key: 'tbwLiters', label: 'Tổng nước', unit: 'lít', ...INBODY_LIMITS.tbwLiters },
  { key: 'proteinKg', label: 'Protein', unit: 'kg', ...INBODY_LIMITS.proteinKg },
  { key: 'mineralKg', label: 'Khoáng chất', unit: 'kg', ...INBODY_LIMITS.mineralKg },
  {
    key: 'visceralFatLevel',
    label: 'Mỡ nội tạng',
    unit: 'mức',
    ...INBODY_LIMITS.visceralFatLevel,
    integer: true,
  },
  { key: 'waistHipRatio', label: 'Tỷ lệ eo/hông', unit: '', ...INBODY_LIMITS.waistHipRatio },
  {
    key: 'inbodyScore',
    label: 'Điểm InBody',
    unit: 'điểm',
    ...INBODY_LIMITS.inbodyScore,
    integer: true,
  },
]

export const SEGMENT_FIELDS: FieldSpec[] = SEGMENTS.map((key) => ({
  key,
  label: SEGMENT_NAME[key],
  unit: 'kg',
  ...INBODY_LIMITS.segment,
}))

const ALL_FIELDS = [...QUICK_FIELDS, ...PRO_FIELDS, ...SEGMENT_FIELDS]

export type EntryValues = Record<EntryField, string> & { notes: string }

/** What an existing log may hold; numbers arrive as strings from Prisma decimals. */
export interface EntrySource {
  heightCm?: unknown
  weightKg?: unknown
  skeletalMuscleMassKg?: unknown
  muscleMassKg?: unknown
  bodyFatPct?: unknown
  tbwLiters?: unknown
  proteinKg?: unknown
  mineralKg?: unknown
  visceralFatLevel?: unknown
  waistHipRatio?: unknown
  inbodyScore?: unknown
  segmentalLean?: unknown
  notes?: string | null
}

const text = (value: unknown) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim()) ? String(value) : ''

export function entryValues(source?: EntrySource | null): EntryValues {
  const segments =
    source?.segmentalLean && typeof source.segmentalLean === 'object'
      ? (source.segmentalLean as Record<string, unknown>)
      : {}
  return {
    heightCm: text(source?.heightCm),
    weightKg: text(source?.weightKg),
    // Older logs only have muscle mass, which the backend now treats as SMM.
    skeletalMuscleMassKg: text(source?.skeletalMuscleMassKg) || text(source?.muscleMassKg),
    bodyFatPct: text(source?.bodyFatPct),
    tbwLiters: text(source?.tbwLiters),
    proteinKg: text(source?.proteinKg),
    mineralKg: text(source?.mineralKg),
    visceralFatLevel: text(source?.visceralFatLevel),
    waistHipRatio: text(source?.waistHipRatio),
    inbodyScore: text(source?.inbodyScore),
    rightArm: text(segments.rightArm),
    leftArm: text(segments.leftArm),
    trunk: text(segments.trunk),
    rightLeg: text(segments.rightLeg),
    leftLeg: text(segments.leftLeg),
    notes: source?.notes ?? '',
  }
}

/** Pro mode opens by default when an existing log already has pro-only readings. */
export function hasProData(values: EntryValues) {
  return [...PRO_FIELDS, ...SEGMENT_FIELDS].some((field) => values[field.key].trim() !== '')
}

export interface InbodyPayload {
  heightCm: number
  weightKg: number
  skeletalMuscleMassKg: number
  bodyFatPct: number
  tbwLiters?: number | null
  proteinKg?: number | null
  mineralKg?: number | null
  visceralFatLevel?: number | null
  waistHipRatio?: number | null
  inbodyScore?: number | null
  segmentalLean?: Partial<Record<InbodySegment, number | null>>
  notes?: string | null
}

export interface EntryCheck {
  /** Per-field messages, shown under each input. */
  errors: Partial<Record<EntryField, string>>
  /** Cross-field problem, such as muscle plus fat exceeding body weight. */
  formError: string | null
  derived: DerivedInbody
  /** Ready to send when there are no errors. */
  payload: InbodyPayload | null
}

const kg = (value: number) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)} kg`
const NUMBER = /^\d+(?:[.,]\d{1,2})?$/
const INTEGER = /^\d+$/

function parseField(spec: FieldSpec, raw: string): { value: number | null; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: null }
  if (!(spec.integer ? INTEGER : NUMBER).test(trimmed))
    return { value: null, error: spec.integer ? 'Nhập số nguyên.' : 'Tối đa 2 chữ số thập phân.' }
  const value = Number(trimmed.replace(',', '.'))
  if (value < spec.min || value > spec.max)
    return {
      value: null,
      error: `Từ ${spec.min} đến ${spec.max}${spec.unit ? ` ${spec.unit}` : ''}.`,
    }
  return { value }
}

/**
 * Validates the form for the given mode. In quick mode the pro readings are left out of the
 * payload so editing a log never wipes data entered earlier in pro mode; in pro mode an
 * emptied field is sent as null when editing, so the coach can clear it.
 */
export function checkEntry(values: EntryValues, mode: EntryMode, editing: boolean): EntryCheck {
  const errors: EntryCheck['errors'] = {}
  const numbers: Partial<Record<EntryField, number | null>> = {}
  const fields = mode === 'pro' ? ALL_FIELDS : QUICK_FIELDS
  for (const spec of fields) {
    const { value, error } = parseField(spec, values[spec.key])
    if (error) errors[spec.key] = error
    numbers[spec.key] = value
  }
  for (const spec of QUICK_FIELDS)
    if (!errors[spec.key] && numbers[spec.key] === null) errors[spec.key] = 'Bắt buộc.'

  const derived = deriveInbody({
    heightCm: numbers.heightCm ?? null,
    weightKg: numbers.weightKg ?? null,
    bodyFatPct: numbers.bodyFatPct ?? null,
  })

  let formError: string | null = null
  const weight = numbers.weightKg
  const smm = numbers.skeletalMuscleMassKg
  if (weight && smm && derived.bodyFatMassKg !== null && smm + derived.bodyFatMassKg >= weight)
    formError = `Cơ xương (${kg(smm)}) cộng khối mỡ (${kg(derived.bodyFatMassKg)}) không thể bằng hoặc vượt cân nặng (${kg(weight)}). Kiểm tra lại số liệu.`
  const segmentTotal = SEGMENTS.reduce((sum, key) => sum + (numbers[key] ?? 0), 0)
  if (!formError && weight && segmentTotal >= weight)
    formError = `Tổng cơ 5 vùng (${kg(segmentTotal)}) không thể vượt cân nặng.`

  if (formError || Object.keys(errors).length > 0)
    return { errors, formError, derived, payload: null }

  const notes = values.notes.trim()
  const payload: InbodyPayload = {
    heightCm: numbers.heightCm!,
    weightKg: numbers.weightKg!,
    skeletalMuscleMassKg: numbers.skeletalMuscleMassKg!,
    bodyFatPct: numbers.bodyFatPct!,
  }
  if (mode === 'pro') {
    for (const spec of PRO_FIELDS) {
      const value = numbers[spec.key] ?? null
      if (value !== null || editing) payload[spec.key as ProKey] = value
    }
    const segments: Partial<Record<InbodySegment, number | null>> = {}
    for (const key of SEGMENTS) {
      const value = numbers[key] ?? null
      if (value !== null || editing) segments[key] = value
    }
    if (Object.values(segments).some((value) => value !== null) || editing)
      payload.segmentalLean = segments
  }
  if (notes) payload.notes = notes
  else if (editing) payload.notes = null
  return { errors, formError: null, derived, payload }
}
