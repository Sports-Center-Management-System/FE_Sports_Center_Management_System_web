import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { Plus, Search, ChevronDown, Check, X } from 'lucide-react'
import { money } from '@/lib/api'
import { cn } from '@/lib/utils'
import { managerApi, managerKeys } from '../api/manager-api'
import type { CoachRate, CoachRow, Discipline, Specialty } from '../types/manager.types'
import { dayOnly, errorMessage, formatDate, formatDay, formatTime, vnDay } from '../lib/format'
import {
  Btn,
  EmptyRow,
  Field,
  FormError,
  Modal,
  PageHeader,
  Panel,
  Pill,
  SelectInput,
  StateMessage,
  Table,
  Tabs,
  Td,
  TextArea,
  TextInput,
  Th,
  Pagination,
} from '../components/manager-ui'
import { usePagination } from '../lib/use-pagination'

export function ManagerCoachesPage() {
  const [tab, setTab] = useState<'coaches' | 'specialties'>('coaches')
  const coaches = useQuery({ queryKey: managerKeys.coaches, queryFn: managerApi.coaches })
  const specialties = useQuery({
    queryKey: managerKeys.specialties,
    queryFn: managerApi.specialties,
  })
  const disciplines = useQuery({
    queryKey: managerKeys.disciplines,
    queryFn: managerApi.disciplines,
  })

  return (
    <div className="rounded-md bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <PageHeader
        title="HLV & biểu phí"
        description="Gán chuyên môn và đặt giá dạy 1-1 cho từng huấn luyện viên."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'coaches', label: 'Huấn luyện viên', count: coaches.data?.length },
          { value: 'specialties', label: 'Danh mục chuyên môn', count: specialties.data?.length },
        ]}
      />
      {tab === 'coaches' ? (
        <CoachesTab
          coaches={coaches}
          specialties={specialties.data ?? []}
          disciplines={disciplines.data ?? []}
        />
      ) : (
        <SpecialtiesTab
          specialties={specialties}
          coaches={coaches.data ?? []}
          disciplines={disciplines.data ?? []}
        />
      )}
    </div>
  )
}

function currentRate(rates: CoachRate[]) {
  const today = vnDay()
  return rates.filter(
    (rate) =>
      dayOnly(rate.effectiveFrom) <= today &&
      (!rate.effectiveTo || dayOnly(rate.effectiveTo) >= today),
  )
}

function CoachesTab({
  coaches,
  specialties,
  disciplines,
}: {
  coaches: UseQueryResult<CoachRow[]>
  specialties: Specialty[]
  disciplines: Discipline[]
}) {
  const list = coaches.data ?? []
  const [selectedId, setSelectedId] = useState<string | null>(() => list[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Auto select first coach if none selected and list loaded
  useEffect(() => {
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id)
    }
  }, [list, selectedId])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const selected = list.find((coach) => coach.id === selectedId) ?? null

  // Filter coaches matching user input in real-time
  const term = search.trim().toLowerCase()
  const filteredCoaches = list.filter((coach) => {
    if (!term) return true
    const nameMatch = coach.fullName.toLowerCase().includes(term)
    const specMatch = (coach.coachProfile?.coachSpecialties ?? []).some((s) =>
      s.specialty.name.toLowerCase().includes(term),
    )
    return nameMatch || specMatch
  })

  if (coaches.isLoading || coaches.isError)
    return (
      <Panel>
        <StateMessage
          loading={coaches.isLoading}
          error={coaches.isError ? errorMessage(coaches.error) : null}
          onRetry={() => void coaches.refetch()}
        />
      </Panel>
    )

  return (
    <div className="space-y-6">
      {/* Searchable Coach Combobox Input */}
      <Panel className="p-4 sm:p-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Tìm và chọn Huấn luyện viên
          </label>
          <div ref={comboboxRef} className="relative max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                placeholder={
                  selected
                    ? `Đang chọn: ${selected.fullName} (Nhập để lọc danh sách HLV...)`
                    : 'Nhập tên hoặc chuyên môn để tìm HLV...'
                }
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setIsOpen(true)
                }}
                className="w-full h-10 pl-9 pr-10 text-sm bg-white border border-slate-300 rounded-md shadow-2xs focus:border-[#008b74] focus:ring-1 focus:ring-[#008b74] focus:outline-none transition-colors"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown with live filtering */}
            {isOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg divide-y divide-slate-100 animate-in fade-in-50 duration-100">
                {filteredCoaches.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không tìm thấy Huấn luyện viên nào khớp với "{search}"
                  </div>
                ) : (
                  filteredCoaches.map((coach) => {
                    const specs = coach.coachProfile?.coachSpecialties ?? []
                    const rates = currentRate(coach.coachRates)
                    const isSelected = coach.id === selectedId
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(coach.id)
                          setSearch('')
                          setIsOpen(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer',
                          isSelected && 'bg-emerald-50/70',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {coach.fullName}
                            </span>
                            {isSelected && (
                              <span className="text-[11px] font-bold text-[#008b74] bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {specs.length
                              ? specs.map((s) => s.specialty.name).join(', ')
                              : 'Chưa gán chuyên môn'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {rates.length
                              ? `Phí: ${rates.map((r) => money(r.ratePerSession)).join(' / ')} / buổi`
                              : 'Chưa có biểu phí hiệu lực'}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#008b74] shrink-0" />}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {selected && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span className="font-medium">HLV hiện tại:</span>
              <span className="font-bold text-slate-900">{selected.fullName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                {selected.coachProfile?.yearsExperience
                  ? `${selected.coachProfile.yearsExperience} năm kinh nghiệm`
                  : 'Huấn luyện viên'}
              </span>
            </div>
          )}
        </div>
      </Panel>

      {/* Full-width Detail Panels */}
      {selected ? (
        <div className="space-y-6">
          <CoachSpecialties key={`s-${selected.id}`} coach={selected} specialties={specialties} />
          <CoachRates key={`r-${selected.id}`} coach={selected} disciplines={disciplines} />
          <CoachSlots key={`a-${selected.id}`} coach={selected} />
        </div>
      ) : (
        <Panel>
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            Chọn một Huấn luyện viên ở trên để xem chuyên môn và biểu phí.
          </p>
        </Panel>
      )}
    </div>
  )
}

function CoachSpecialties({ coach, specialties }: { coach: CoachRow; specialties: Specialty[] }) {
  const queryClient = useQueryClient()
  const initial = (coach.coachProfile?.coachSpecialties ?? []).map((s) => s.specialtyId)
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(initial))
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const dirty = chosen.size !== initial.length || initial.some((id) => !chosen.has(id))
  const save = useMutation({
    mutationFn: () => managerApi.assignSpecialties(coach.id, [...chosen]),
    onSuccess: () => {
      setMessage({ ok: true, text: 'Đã lưu chuyên môn.' })
      void queryClient.invalidateQueries({ queryKey: managerKeys.coaches })
    },
    onError: (error) => setMessage({ ok: false, text: errorMessage(error) }),
  })
  const groups = new Map<string, Specialty[]>()
  for (const s of specialties) {
    const key = s.discipline?.name ?? 'Khác'
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Panel
      title={`Chuyên môn của ${coach.fullName}`}
      actions={
        <Btn
          size="sm"
          tone="primary"
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Đang lưu…' : 'Lưu chuyên môn'}
        </Btn>
      }
    >
      <div className="space-y-3 p-4">
        {specialties.length === 0 ? (
          <p className="text-sm text-slate-400">
            Chưa có chuyên môn nào. Thêm ở tab Danh mục chuyên môn.
          </p>
        ) : null}
        {[...groups].map(([discipline, items]) => (
          <fieldset key={discipline}>
            <legend className="mb-1 text-xs font-medium text-slate-500">{discipline}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {items.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#008b74]"
                    checked={chosen.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {message ? (
          <p className={message.ok ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}>
            {message.text}
          </p>
        ) : null}
        <p className="text-xs text-slate-400">
          HLV chỉ được xếp lớp và đặt biểu phí cho những môn có chuyên môn đã gán.
        </p>
      </div>
    </Panel>
  )
}

function CoachRates({ coach, disciplines }: { coach: CoachRow; disciplines: Discipline[] }) {
  const queryClient = useQueryClient()
  const rates = useQuery({
    queryKey: managerKeys.rates(coach.id),
    queryFn: () => managerApi.rates(coach.id),
  })
  const [editing, setEditing] = useState<CoachRate | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: managerKeys.rates(coach.id) })
    void queryClient.invalidateQueries({ queryKey: managerKeys.coaches })
  }
  const remove = useMutation({
    mutationFn: (rate: CoachRate) => managerApi.deleteRate(coach.id, rate.id),
    onSuccess: () => {
      setError(null)
      refresh()
    },
    onError: (err) => setError(errorMessage(err)),
  })
  const coachDisciplineIds = new Set(
    (coach.coachProfile?.coachSpecialties ?? []).map((s) => s.specialty.disciplineId),
  )
  const allowed = disciplines.filter((d) => coachDisciplineIds.has(d.id))
  const today = vnDay()

  return (
    <Panel
      title="Biểu phí dạy 1-1"
      actions={
        <Btn size="sm" disabled={allowed.length === 0} onClick={() => setEditing('new')}>
          <Plus className="h-3.5 w-3.5" />
          Thêm biểu phí
        </Btn>
      }
    >
      {allowed.length === 0 ? (
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-amber-700">
          Cần gán chuyên môn trước khi đặt biểu phí.
        </p>
      ) : null}
      <FormError inset>{error}</FormError>
      {rates.isLoading || rates.isError ? (
        <StateMessage
          loading={rates.isLoading}
          error={rates.isError ? errorMessage(rates.error) : null}
          onRetry={() => void rates.refetch()}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Môn</Th>
              <Th>Giá mỗi buổi</Th>
              <Th>Áp dụng từ</Th>
              <Th>Đến</Th>
              <Th />
              <Th className="text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody>
            {(rates.data ?? []).length === 0 ? (
              <EmptyRow colSpan={6}>Chưa có biểu phí.</EmptyRow>
            ) : (
              (rates.data ?? []).map((rate) => {
                const from = dayOnly(rate.effectiveFrom)
                const to = rate.effectiveTo ? dayOnly(rate.effectiveTo) : null
                const state = from > today ? 'future' : to && to < today ? 'past' : 'current'
                return (
                  <tr key={rate.id}>
                    <Td>{rate.discipline?.name ?? '—'}</Td>
                    <Td className="tabular-nums">{money(rate.ratePerSession)}</Td>
                    <Td>{formatDay(rate.effectiveFrom)}</Td>
                    <Td>{to ? formatDay(to) : 'Không giới hạn'}</Td>
                    <Td>
                      {state === 'current' ? (
                        <Pill tone="green">Đang áp dụng</Pill>
                      ) : state === 'future' ? (
                        <Pill tone="blue">Sắp áp dụng</Pill>
                      ) : (
                        <Pill>Đã hết</Pill>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Btn size="sm" tone="ghost" onClick={() => setEditing(rate)}>
                        Sửa
                      </Btn>
                      {state === 'future' ? (
                        <Btn
                          size="sm"
                          tone="danger"
                          disabled={remove.isPending}
                          onClick={() => window.confirm('Xóa biểu phí này?') && remove.mutate(rate)}
                        >
                          Xóa
                        </Btn>
                      ) : null}
                    </Td>
                  </tr>
                )
              })
            )}
          </tbody>
        </Table>
      )}
      {editing ? (
        <RateForm
          coach={coach}
          rate={editing === 'new' ? null : editing}
          disciplines={allowed}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      ) : null}
    </Panel>
  )
}

function RateForm({
  coach,
  rate,
  disciplines,
  onClose,
  onSaved,
}: {
  coach: CoachRow
  rate: CoachRate | null
  disciplines: Discipline[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    disciplineId: rate?.disciplineId ?? disciplines[0]?.id ?? '',
    ratePerSession: rate ? String(Number(rate.ratePerSession)) : '',
    effectiveFrom: rate ? dayOnly(rate.effectiveFrom) : vnDay(),
    effectiveTo: rate?.effectiveTo ? dayOnly(rate.effectiveTo) : '',
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const save = useMutation({
    mutationFn: () => {
      const body = {
        disciplineId: form.disciplineId,
        ratePerSession: Number(form.ratePerSession),
        effectiveFrom: form.effectiveFrom,
        ...(form.effectiveTo ? { effectiveTo: form.effectiveTo } : {}),
      }
      return rate
        ? managerApi.updateRate(coach.id, rate.id, body)
        : managerApi.createRate(coach.id, body)
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom)
      return setError('Ngày kết thúc phải sau ngày bắt đầu áp dụng.')
    setError(null)
    save.mutate()
  }
  const options =
    rate?.discipline && !disciplines.some((d) => d.id === rate.disciplineId)
      ? [rate.discipline, ...disciplines]
      : disciplines

  return (
    <Modal
      title={rate ? 'Sửa biểu phí' : `Thêm biểu phí cho ${coach.fullName}`}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="rate-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu biểu phí'}
          </Btn>
        </>
      }
    >
      <form id="rate-form" onSubmit={submit} className="space-y-3">
        <Field label="Môn">
          <SelectInput required value={form.disciplineId} onChange={set('disciplineId')}>
            {options.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Giá mỗi buổi (VND)">
          <TextInput
            type="number"
            required
            min={0}
            step={1000}
            value={form.ratePerSession}
            onChange={set('ratePerSession')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Áp dụng từ">
            <TextInput
              type="date"
              required
              value={form.effectiveFrom}
              onChange={set('effectiveFrom')}
            />
          </Field>
          <Field label="Đến ngày" hint="Để trống nếu không giới hạn.">
            <TextInput type="date" value={form.effectiveTo} onChange={set('effectiveTo')} />
          </Field>
        </div>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}

function SpecialtiesTab({
  specialties,
  coaches,
  disciplines,
}: {
  specialties: UseQueryResult<Specialty[]>
  coaches: CoachRow[]
  disciplines: Discipline[]
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Specialty | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { items: pageSpecialties, pager } = usePagination(specialties.data ?? [], 15)
  const usage = new Map<string, number>()
  for (const coach of coaches)
    for (const s of coach.coachProfile?.coachSpecialties ?? [])
      usage.set(s.specialtyId, (usage.get(s.specialtyId) ?? 0) + 1)
  const remove = useMutation({
    mutationFn: (id: string) => managerApi.deleteSpecialty(id),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: managerKeys.specialties })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <Panel
      title="Danh mục chuyên môn"
      actions={
        <Btn size="sm" tone="primary" onClick={() => setEditing('new')}>
          <Plus className="h-3.5 w-3.5" />
          Thêm chuyên môn
        </Btn>
      }
    >
      <FormError inset>{error}</FormError>
      {specialties.isLoading || specialties.isError ? (
        <StateMessage
          loading={specialties.isLoading}
          error={specialties.isError ? errorMessage(specialties.error) : null}
          onRetry={() => void specialties.refetch()}
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Tên</Th>
                <Th>Mã</Th>
                <Th>Môn</Th>
                <Th>HLV đang có</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {(specialties.data ?? []).length === 0 ? (
                <EmptyRow colSpan={5}>Chưa có chuyên môn.</EmptyRow>
              ) : (
                pageSpecialties.map((s) => {
                  const used = usage.get(s.id) ?? 0
                  return (
                    <tr key={s.id}>
                      <Td>
                        <div className="font-medium text-slate-900">{s.name}</div>
                        {s.description ? (
                          <div className="text-xs text-slate-400">{s.description}</div>
                        ) : null}
                      </Td>
                      <Td className="font-mono text-xs">{s.code}</Td>
                      <Td>{s.discipline?.name ?? '—'}</Td>
                      <Td className="tabular-nums">{used}</Td>
                      <Td className="whitespace-nowrap text-right">
                        <Btn size="sm" tone="ghost" onClick={() => setEditing(s)}>
                          Sửa
                        </Btn>
                        <Btn
                          size="sm"
                          tone="danger"
                          disabled={used > 0 || remove.isPending}
                          title={used > 0 ? 'Đang có HLV dùng chuyên môn này' : undefined}
                          onClick={() =>
                            window.confirm(`Xóa chuyên môn ${s.name}?`) && remove.mutate(s.id)
                          }
                        >
                          Xóa
                        </Btn>
                      </Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
          <Pagination pager={pager} />
        </>
      )}
      {editing ? (
        <SpecialtyForm
          specialty={editing === 'new' ? null : editing}
          disciplines={disciplines}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.specialties })
            void queryClient.invalidateQueries({ queryKey: managerKeys.coaches })
          }}
        />
      ) : null}
    </Panel>
  )
}

function SpecialtyForm({
  specialty,
  disciplines,
  onClose,
  onSaved,
}: {
  specialty: Specialty | null
  disciplines: Discipline[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    disciplineId: specialty?.disciplineId ?? disciplines[0]?.id ?? '',
    code: specialty?.code ?? '',
    name: specialty?.name ?? '',
    description: specialty?.description ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const save = useMutation({
    mutationFn: () => {
      const body = {
        disciplineId: form.disciplineId,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      }
      return specialty
        ? managerApi.updateSpecialty(specialty.id, body)
        : managerApi.createSpecialty(body)
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  return (
    <Modal
      title={specialty ? `Sửa ${specialty.name}` : 'Thêm chuyên môn'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="specialty-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : specialty ? 'Lưu' : 'Thêm'}
          </Btn>
        </>
      }
    >
      <form
        id="specialty-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
        className="space-y-3"
      >
        <Field
          label="Môn"
          hint={specialty ? 'Không đổi được môn của chuyên môn đã tạo.' : undefined}
        >
          <SelectInput
            required
            disabled={!!specialty}
            value={form.disciplineId}
            onChange={set('disciplineId')}
          >
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Tên chuyên môn">
          <TextInput
            required
            maxLength={150}
            placeholder="Kỹ thuật phòng thủ"
            value={form.name}
            onChange={set('name')}
          />
        </Field>
        <Field label="Mã" hint="Viết liền, không dấu, không trùng. Ví dụ BOX_DEFENSE.">
          <TextInput
            required
            maxLength={50}
            pattern="[A-Za-z0-9_]+"
            value={form.code}
            onChange={set('code')}
          />
        </Field>
        <Field label="Mô tả">
          <TextArea value={form.description} onChange={set('description')} />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}

function CoachSlots({ coach }: { coach: CoachRow }) {
  const slots = useQuery({
    queryKey: managerKeys.coachSlots(coach.id),
    queryFn: () => managerApi.coachSlots(coach.id),
  })
  const rows = slots.data ?? []
  return (
    <Panel title="Khung giờ rảnh dạy 1-1 sắp tới">
      {slots.isLoading || slots.isError ? (
        <StateMessage
          loading={slots.isLoading}
          error={slots.isError ? errorMessage(slots.error) : null}
          onRetry={() => void slots.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">
          HLV chưa mở khung giờ trống nào.
        </p>
      ) : (
        <ul className="grid gap-1.5 p-4 sm:grid-cols-2">
          {rows.slice(0, 20).map((slot) => (
            <li
              key={slot.id}
              className="rounded border border-slate-200 px-3 py-1.5 text-sm tabular-nums text-slate-700"
            >
              {formatTime(slot.startTime)}–{formatTime(slot.endTime)}{' '}
              <span className="text-slate-400">{formatDate(slot.startTime)}</span>
            </li>
          ))}
          {rows.length > 20 ? (
            <li className="text-xs text-slate-400 sm:col-span-2">
              và {rows.length - 20} khung giờ khác.
            </li>
          ) : null}
        </ul>
      )}
    </Panel>
  )
}
