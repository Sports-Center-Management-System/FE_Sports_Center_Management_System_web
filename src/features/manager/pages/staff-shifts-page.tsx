import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Copy, Sparkles, CalendarDays } from 'lucide-react'
import { managerApi, managerKeys } from '../api/manager-api'
import type { StaffShift } from '../types/manager.types'
import { BulkShiftModal } from '../components/bulk-shift-modal'
import { FridayCloneShiftModal } from '../components/friday-clone-shift-modal'
import { MemberDatePickerModal } from '@/features/calendar/components/member-date-picker-modal'
import {
  addDaysToDay,
  dayOnly,
  errorMessage,
  formatDay,
  formatTime,
  mondayOf,
  vnClock,
  vnDay,
  vnInstant,
} from '../lib/format'
import {
  Btn,
  Field,
  FormError,
  Modal,
  PageHeader,
  Panel,
  SelectInput,
  StateMessage,
  TextInput,
} from '../components/manager-ui'

const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

export function ManagerStaffShiftsPage() {
  const queryClient = useQueryClient()
  const shifts = useQuery({ queryKey: managerKeys.shifts, queryFn: managerApi.shifts })
  const staff = useQuery({ queryKey: managerKeys.staff, queryFn: managerApi.staff })
  const [week, setWeek] = useState(() => mondayOf(vnDay()))
  const [editing, setEditing] = useState<StaffShift | { day: string } | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)

  const names = new Map((staff.data ?? []).map((user) => [user.id, user.fullName]))
  const receptionists = (staff.data ?? []).filter(
    (user) => user.role === 'RECEPTIONIST' && user.isActive,
  )
  const days = weekdays.map((label, index) => ({ label, day: addDaysToDay(week, index) }))
  const byDay = new Map<string, StaffShift[]>()
  for (const shift of shifts.data ?? []) {
    const key = dayOnly(shift.shiftDate)
    byDay.set(key, [...(byDay.get(key) ?? []), shift])
  }
  for (const list of byDay.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime))
  const today = vnDay()

  const shiftCountThisWeek = (shifts.data ?? []).filter((s) => {
    const d = dayOnly(s.shiftDate)
    return d >= week && d <= addDaysToDay(week, 6)
  }).length

  return (
    <div className="rounded-md bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <PageHeader
        title="Ca trực lễ tân"
        description="Xếp ca theo tuần. Ca trùng giờ của cùng một người sẽ bị từ chối."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Btn tone="secondary" onClick={() => setShowCloneModal(true)}>
              <Copy className="h-4 w-4" />
              Lên lịch tuần tới (Thứ 6)
            </Btn>
            <Btn tone="secondary" onClick={() => setShowBulkModal(true)}>
              <Sparkles className="h-4 w-4" />
              Xếp ca hàng loạt
            </Btn>
            <Btn tone="primary" onClick={() => setEditing({ day: today < week ? week : today })}>
              <Plus className="h-4 w-4" />
              Tạo ca lẻ
            </Btn>
          </div>
        }
      />
      <Panel
        title={`Tuần ${formatDay(week)} – ${formatDay(addDaysToDay(week, 6))}`}
        actions={
          <div className="flex items-center gap-1.5">
            <Btn
              size="sm"
              onClick={() => setShowDatePickerModal(true)}
              className="inline-flex items-center gap-1.5"
            >
              <CalendarDays className="h-4 w-4 text-[#008b74]" />
              <span>Chọn ngày / tuần</span>
            </Btn>
            <Btn
              size="sm"
              tone="ghost"
              aria-label="Tuần trước"
              onClick={() => setWeek(addDaysToDay(week, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Btn>
            <Btn size="sm" onClick={() => setWeek(mondayOf(vnDay()))}>
              Tuần này
            </Btn>
            <Btn
              size="sm"
              tone="ghost"
              aria-label="Tuần sau"
              onClick={() => setWeek(addDaysToDay(week, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Btn>
          </div>
        }
      >
        {shifts.isLoading || shifts.isError ? (
          <StateMessage
            loading={shifts.isLoading}
            error={shifts.isError ? errorMessage(shifts.error) : null}
            onRetry={() => void shifts.refetch()}
          />
        ) : (
          <div className="grid divide-y divide-slate-100 md:grid-cols-7 md:divide-x md:divide-y-0">
            {days.map(({ label, day }) => {
              const list = byDay.get(day) ?? []
              return (
                <div key={day} className="flex min-h-[180px] flex-col p-2">
                  <div
                    className={
                      day === today ? 'mb-2 font-medium text-[#007461]' : 'mb-2 text-slate-600'
                    }
                  >
                    <span className="text-sm">{label}</span>
                    <span className="ml-1 text-xs text-slate-400">
                      {formatDay(day).slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {list.map((shift) => (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => setEditing(shift)}
                        className="block w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-xs hover:border-[#008b74]"
                      >
                        <span className="block font-medium tabular-nums text-slate-900">
                          {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                        </span>
                        <span className="block truncate text-slate-600">
                          {names.get(shift.staffId) ?? 'Nhân viên'}
                        </span>
                        {shift.notes ? (
                          <span className="block truncate text-slate-400">{shift.notes}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing({ day })}
                    className="mt-2 rounded py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-[#007461]"
                  >
                    + Thêm ca
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
      <p className="mt-2 text-xs text-slate-400">Hệ thống chỉ trả về 200 ca gần nhất.</p>
      {editing ? (
        <ShiftForm
          shift={'id' in editing ? editing : null}
          day={'id' in editing ? dayOnly(editing.shiftDate) : editing.day}
          receptionists={receptionists}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.shifts })
          }}
        />
      ) : null}
      <BulkShiftModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        staffList={staff.data ?? []}
        currentWeek={week}
      />
      <FridayCloneShiftModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        currentWeek={week}
        shiftCountThisWeek={shiftCountThisWeek}
      />
      <MemberDatePickerModal
        isOpen={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        currentWeek={week}
        onSelectWeek={(selectedMonday) => {
          setWeek(selectedMonday)
          setShowDatePickerModal(false)
        }}
      />
    </div>
  )
}

function ShiftForm({
  shift,
  day,
  receptionists,
  onClose,
  onSaved,
}: {
  shift: StaffShift | null
  day: string
  receptionists: Array<{ id: string; fullName: string }>
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    staffId: shift?.staffId ?? receptionists[0]?.id ?? '',
    day,
    start: shift ? vnClock(shift.startTime) : '06:00',
    end: shift ? vnClock(shift.endTime) : '14:00',
    notes: shift?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const onError = (err: unknown) => setError(errorMessage(err))

  const save = useMutation({
    mutationFn: () => {
      const body = {
        staffId: form.staffId,
        shiftDate: form.day,
        startTime: vnInstant(form.day, form.start),
        endTime: vnInstant(form.day, form.end),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      }
      return shift ? managerApi.updateShift(shift.id, body) : managerApi.createShift(body)
    },
    onSuccess: onSaved,
    onError,
  })
  const remove = useMutation({
    mutationFn: () => managerApi.deleteShift(shift!.id),
    onSuccess: onSaved,
    onError,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.staffId) return setError('Chưa có lễ tân nào đang làm việc để xếp ca.')
    if (form.end <= form.start) return setError('Giờ kết thúc phải sau giờ bắt đầu.')
    setError(null)
    save.mutate()
  }

  return (
    <Modal
      title={shift ? 'Sửa ca trực' : 'Xếp ca trực'}
      onClose={onClose}
      footer={
        <>
          {shift ? (
            <Btn
              tone="danger"
              className="mr-auto"
              disabled={remove.isPending}
              onClick={() => window.confirm('Xóa ca trực này?') && remove.mutate()}
            >
              Xóa ca
            </Btn>
          ) : null}
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="shift-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu ca'}
          </Btn>
        </>
      }
    >
      <form id="shift-form" onSubmit={submit} className="space-y-3">
        <Field label="Lễ tân">
          <SelectInput required value={form.staffId} onChange={set('staffId')}>
            {receptionists.length === 0 ? <option value="">Chưa có lễ tân</option> : null}
            {receptionists.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Ngày trực">
          <TextInput type="date" required value={form.day} onChange={set('day')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bắt đầu">
            <TextInput type="time" required value={form.start} onChange={set('start')} />
          </Field>
          <Field label="Kết thúc">
            <TextInput type="time" required value={form.end} onChange={set('end')} />
          </Field>
        </div>
        <Field label="Ghi chú">
          <TextInput
            placeholder="Ví dụ: Ca sáng quầy chính"
            value={form.notes}
            onChange={set('notes')}
          />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}
