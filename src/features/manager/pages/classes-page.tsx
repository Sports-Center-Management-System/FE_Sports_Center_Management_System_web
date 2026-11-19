import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { managerApi, managerKeys } from '../api/manager-api'
import type { CoachRow, Discipline, GymClass, Room, Schedule } from '../types/manager.types'
import {
  errorMessage,
  formatDay,
  formatTime,
  vnClock,
  vnDay,
  vnInstant,
  addDaysToDay,
} from '../lib/format'
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

const DEFAULT_CAPACITY = 10

export function ManagerClassesPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'schedules' | 'classes'>('schedules')
  const schedules = useQuery({ queryKey: managerKeys.schedules, queryFn: managerApi.schedules })
  const classes = useQuery({ queryKey: managerKeys.classes, queryFn: managerApi.classes })
  const rooms = useQuery({ queryKey: managerKeys.rooms, queryFn: managerApi.rooms })
  const coaches = useQuery({ queryKey: managerKeys.coaches, queryFn: managerApi.coaches })
  const disciplines = useQuery({
    queryKey: managerKeys.disciplines,
    queryFn: managerApi.disciplines,
  })
  const [editingSchedule, setEditingSchedule] = useState<Schedule | 'new' | null>(null)
  const [editingClass, setEditingClass] = useState<GymClass | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const removeSchedule = useMutation({
    mutationFn: (id: string) => managerApi.deleteSchedule(id),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: managerKeys.schedules })
    },
    onError: (err) => setError(errorMessage(err)),
  })
  const removeClass = useMutation({
    mutationFn: (id: string) => managerApi.deleteClass(id),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: managerKeys.classes })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  const scheduleRows = schedules.data ?? []
  const classRows = classes.data ?? []
  // Page the flat list first, then group the page by day so headers never split oddly.
  const schedulePage = usePagination(scheduleRows, 20)
  const classPage = usePagination(classRows, 15)
  const groups = new Map<string, Schedule[]>()
  for (const s of schedulePage.items) {
    const day = vnDay(s.startTime)
    groups.set(day, [...(groups.get(day) ?? []), s])
  }

  return (
    <div className="rounded-md bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <PageHeader
        title="Lớp & lịch"
        description="Loại lớp nhóm và thời khóa biểu sắp diễn ra."
        actions={
          tab === 'schedules' ? (
            <Btn
              tone="primary"
              onClick={() => setEditingSchedule('new')}
              disabled={classRows.length === 0}
            >
              <Plus className="h-4 w-4" />
              Xếp lịch
            </Btn>
          ) : (
            <Btn tone="primary" onClick={() => setEditingClass('new')}>
              <Plus className="h-4 w-4" />
              Thêm lớp
            </Btn>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'schedules', label: 'Thời khóa biểu', count: scheduleRows.length },
          { value: 'classes', label: 'Loại lớp', count: classRows.length },
        ]}
      />
      <div className="mb-3 empty:hidden">
        <FormError>{error}</FormError>
      </div>

      {tab === 'schedules' ? (
        <Panel>
          {schedules.isLoading || schedules.isError ? (
            <StateMessage
              loading={schedules.isLoading}
              error={schedules.isError ? errorMessage(schedules.error) : null}
              onRetry={() => void schedules.refetch()}
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Giờ</Th>
                    <Th>Lớp</Th>
                    <Th>Phòng</Th>
                    <Th>HLV</Th>
                    <Th>Đã đặt</Th>
                    <Th className="text-right">Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.length === 0 ? (
                    <EmptyRow colSpan={6}>Chưa có lịch nào sắp diễn ra.</EmptyRow>
                  ) : (
                    [...groups].flatMap(([day, items]) => [
                      <tr key={day}>
                        <td
                          colSpan={6}
                          className="bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500"
                        >
                          {formatDay(day)}
                        </td>
                      </tr>,
                      ...items.map((s) => (
                        <tr key={s.id}>
                          <Td className="whitespace-nowrap tabular-nums">
                            {formatTime(s.startTime)}–{formatTime(s.endTime)}
                          </Td>
                          <Td>
                            <div className="font-medium text-slate-900">{s.class?.name}</div>
                            <div className="text-xs text-slate-400">
                              {s.class?.discipline?.name}
                            </div>
                          </Td>
                          <Td>{s.room?.name}</Td>
                          <Td>{s.coach?.fullName}</Td>
                          <Td className="tabular-nums">
                            {s.currentEnrolled}/{s.capacity}
                            {s.status === 'FULL' ? <Pill tone="amber">Đầy</Pill> : null}
                          </Td>
                          <Td className="whitespace-nowrap text-right">
                            <Btn
                              size="sm"
                              tone="ghost"
                              disabled={s.currentEnrolled > 0}
                              title={s.currentEnrolled > 0 ? 'Đã có hội viên đặt chỗ' : undefined}
                              onClick={() => setEditingSchedule(s)}
                            >
                              Sửa
                            </Btn>
                            <Btn
                              size="sm"
                              tone="danger"
                              disabled={removeSchedule.isPending}
                              onClick={() =>
                                window.confirm('Xóa lịch này?') && removeSchedule.mutate(s.id)
                              }
                            >
                              Xóa
                            </Btn>
                          </Td>
                        </tr>
                      )),
                    ])
                  )}
                </tbody>
              </Table>
              <Pagination pager={schedulePage.pager} />
            </>
          )}
        </Panel>
      ) : (
        <Panel>
          {classes.isLoading || classes.isError ? (
            <StateMessage
              loading={classes.isLoading}
              error={classes.isError ? errorMessage(classes.error) : null}
              onRetry={() => void classes.refetch()}
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Tên lớp</Th>
                    <Th>Môn</Th>
                    <Th>Mô tả</Th>
                    <Th className="text-right">Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {classRows.length === 0 ? (
                    <EmptyRow colSpan={4}>Chưa có loại lớp nào.</EmptyRow>
                  ) : (
                    classPage.items.map((c) => (
                      <tr key={c.id}>
                        <Td className="font-medium text-slate-900">{c.name}</Td>
                        <Td>{c.discipline?.name}</Td>
                        <Td className="max-w-[360px] text-slate-500">{c.description}</Td>
                        <Td className="whitespace-nowrap text-right">
                          <Btn size="sm" tone="ghost" onClick={() => setEditingClass(c)}>
                            Sửa
                          </Btn>
                          <Btn
                            size="sm"
                            tone="danger"
                            disabled={removeClass.isPending}
                            onClick={() =>
                              window.confirm(`Xóa lớp ${c.name}?`) && removeClass.mutate(c.id)
                            }
                          >
                            Xóa
                          </Btn>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination pager={classPage.pager} />
            </>
          )}
        </Panel>
      )}

      {editingSchedule ? (
        <ScheduleForm
          schedule={editingSchedule === 'new' ? null : editingSchedule}
          classes={classRows}
          rooms={rooms.data ?? []}
          coaches={coaches.data ?? []}
          onClose={() => setEditingSchedule(null)}
          onSaved={() => {
            setEditingSchedule(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.schedules })
          }}
        />
      ) : null}
      {editingClass ? (
        <ClassForm
          gymClass={editingClass === 'new' ? null : editingClass}
          disciplines={(disciplines.data ?? []).filter((d) => d.code.toUpperCase() !== 'GYM')}
          onClose={() => setEditingClass(null)}
          onSaved={() => {
            setEditingClass(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.classes })
          }}
        />
      ) : null}
    </div>
  )
}

function ScheduleForm({
  schedule,
  classes,
  rooms,
  coaches,
  onClose,
  onSaved,
}: {
  schedule: Schedule | null
  classes: GymClass[]
  rooms: Room[]
  coaches: CoachRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(() => {
    const roomId = schedule?.roomId ?? rooms[0]?.id ?? ''
    const roomCapacity = rooms.find((r) => r.id === roomId)?.capacity ?? DEFAULT_CAPACITY
    return {
      classId: schedule?.classId ?? classes[0]?.id ?? '',
      roomId,
      coachId: schedule?.coachId ?? '',
      day: schedule ? vnDay(schedule.startTime) : addDaysToDay(vnDay(), 1),
      start: schedule ? vnClock(schedule.startTime) : '18:00',
      end: schedule ? vnClock(schedule.endTime) : '19:00',
      capacity: String(schedule?.capacity ?? Math.min(DEFAULT_CAPACITY, roomCapacity)),
    }
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const gymClass = classes.find((c) => c.id === form.classId)
  const room = rooms.find((r) => r.id === form.roomId)
  const eligible = coaches.filter((coach) =>
    (coach.coachProfile?.coachSpecialties ?? []).some(
      (s) => s.specialty.disciplineId === gymClass?.disciplineId,
    ),
  )
  const coachId = eligible.some((c) => c.id === form.coachId)
    ? form.coachId
    : (eligible[0]?.id ?? '')

  const save = useMutation({
    mutationFn: () => {
      const body = {
        classId: form.classId,
        roomId: form.roomId,
        coachId,
        startTime: vnInstant(form.day, form.start),
        endTime: vnInstant(form.day, form.end),
        capacity: Number(form.capacity),
      }
      return schedule
        ? managerApi.updateSchedule(schedule.id, body)
        : managerApi.createSchedule(body)
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!coachId) return setError('Chưa có HLV nào có chuyên môn cho môn của lớp này.')
    if (form.end <= form.start) return setError('Giờ kết thúc phải sau giờ bắt đầu.')
    if (new Date(vnInstant(form.day, form.start)) <= new Date())
      return setError('Chỉ xếp được lịch trong tương lai.')
    if (room && Number(form.capacity) > room.capacity)
      return setError(`Phòng ${room.name} chỉ chứa tối đa ${room.capacity} người.`)
    setError(null)
    save.mutate()
  }

  return (
    <Modal
      title={schedule ? 'Sửa lịch lớp' : 'Xếp lịch lớp nhóm'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="schedule-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu lịch'}
          </Btn>
        </>
      }
    >
      <form id="schedule-form" onSubmit={submit} className="space-y-3">
        <Field label="Lớp">
          <SelectInput required value={form.classId} onChange={set('classId')}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.discipline?.name})
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="HLV" hint="Chỉ hiện HLV có chuyên môn thuộc môn của lớp.">
          <SelectInput
            required
            value={coachId}
            onChange={(event) =>
              setForm((current) => ({ ...current, coachId: event.target.value }))
            }
          >
            {eligible.length === 0 ? <option value="">Không có HLV phù hợp</option> : null}
            {eligible.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.fullName}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phòng">
            <SelectInput required value={form.roomId} onChange={set('roomId')}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} chỗ)
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            label="Sĩ số tối đa"
            hint={room ? `Phòng chứa tối đa ${room.capacity}.` : undefined}
          >
            <TextInput
              type="number"
              required
              min={1}
              max={room?.capacity}
              value={form.capacity}
              onChange={set('capacity')}
            />
          </Field>
        </div>
        <Field label="Ngày">
          <TextInput type="date" required min={vnDay()} value={form.day} onChange={set('day')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bắt đầu">
            <TextInput type="time" required value={form.start} onChange={set('start')} />
          </Field>
          <Field label="Kết thúc">
            <TextInput type="time" required value={form.end} onChange={set('end')} />
          </Field>
        </div>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}

function ClassForm({
  gymClass,
  disciplines,
  onClose,
  onSaved,
}: {
  gymClass: GymClass | null
  disciplines: Discipline[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    disciplineId: gymClass?.disciplineId ?? disciplines[0]?.id ?? '',
    name: gymClass?.name ?? '',
    description: gymClass?.description ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const save = useMutation({
    mutationFn: () => {
      const body = {
        disciplineId: form.disciplineId,
        name: form.name.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      }
      return gymClass ? managerApi.updateClass(gymClass.id, body) : managerApi.createClass(body)
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  return (
    <Modal
      title={gymClass ? `Sửa lớp ${gymClass.name}` : 'Thêm loại lớp'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="class-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu lớp'}
          </Btn>
        </>
      }
    >
      <form
        id="class-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
        className="space-y-3"
      >
        <Field label="Môn" hint="Gym không có lớp nhóm nên không có trong danh sách.">
          <SelectInput required value={form.disciplineId} onChange={set('disciplineId')}>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Tên lớp">
          <TextInput required maxLength={150} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Mô tả">
          <TextArea value={form.description} onChange={set('description')} />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}
