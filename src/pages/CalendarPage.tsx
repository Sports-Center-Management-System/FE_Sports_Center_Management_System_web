import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../auth/session-context'
import { PageTitle, StateMessage } from '../components/Layout'
import { errorText, get, post, put, query } from '../lib/api'
import { mondayInVietnam, shiftWeek, vietnamTime, addDays } from '../lib/date'
import { memberKeys } from '../lib/keys'
import { activeFor } from '../lib/eligibility'
import type {
  CalendarData,
  CalendarView,
  Discipline,
  Eligibility,
  PtSlot,
  Schedule,
} from '../lib/types'
const dayName = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
const reasonText: Record<string, string> = {
  SUBSCRIPTION_NOT_ACTIVE_ON_DAY: 'Ngoài hạn gói',
  GROUP_QUOTA_EXHAUSTED: 'Hết lượt nhóm',
  PT_QUOTA_EXHAUSTED: 'Hết lượt PT',
  PT_ALREADY_BOOKED_FOR_DISCIPLINE_DAY: 'Đã có PT môn này trong ngày',
  PT_REBOOK_SAME_CANCELLED_DAY: 'Lần hủy trước không đủ điều kiện đặt lại ngày này',
}
function dateInVietnam(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${date.year}-${date.month}-${date.day}`
}
function SlotCard({
  slot,
  eligibility,
  disciplineId,
  disciplines,
  onBook,
  busy,
}: {
  slot: PtSlot
  eligibility: Eligibility[]
  disciplineId: string
  disciplines: Discipline[]
  onBook: (slotId: string, disciplineId: string) => void
  busy: boolean
}) {
  const choices = slot.eligibleDisciplines.filter((id) => !disciplineId || id === disciplineId)
  const [choice, setChoice] = useState(choices[0] ?? '')
  const selected = choices.includes(choice) ? choice : choices[0]
  if (!selected) return null
  const access = activeFor(eligibility, selected, 'pt')
  return (
    <article className={`session-card ${access.allowed ? '' : 'disabled'}`}>
      <span className="pill">
        PT · {disciplines.find((item) => item.id === selected)?.name ?? 'Bộ môn'}
      </span>
      <strong>{vietnamTime(slot.startAt)}</strong>
      <p>{slot.coach.fullName}</p>
      {choices.length > 1 && (
        <select
          aria-label="Môn PT"
          value={selected}
          onChange={(event) => setChoice(event.target.value)}
        >
          {choices.map((id) => (
            <option key={id} value={id}>
              {disciplines.find((item) => item.id === id)?.name ?? id}
            </option>
          ))}
        </select>
      )}
      <small>
        {access.allowed
          ? `${access.subscriptions.length} gói có thể dùng`
          : (reasonText[access.reason] ?? access.reason)}
      </small>
      <button
        disabled={!access.allowed || busy || new Date(slot.startAt) <= new Date()}
        type="button"
        onClick={() => onBook(slot.id, selected)}
      >
        Đặt PT
      </button>
    </article>
  )
}
function ClassCard({
  schedule,
  eligibility,
  discipline,
  onBook,
  busy,
}: {
  schedule: Schedule
  eligibility: Eligibility[]
  discipline?: Discipline
  onBook: (id: string) => void
  busy: boolean
}) {
  const access = activeFor(eligibility, schedule.disciplineId, 'group')
  const canBook =
    access.allowed &&
    schedule.status === 'OPEN' &&
    schedule.currentEnrolled < schedule.capacity &&
    new Date(schedule.startAt) > new Date()
  return (
    <article className={`session-card ${canBook ? '' : 'disabled'}`}>
      <span className="pill">NHÓM · {discipline?.name ?? 'Bộ môn'}</span>
      <strong>{vietnamTime(schedule.startAt)}</strong>
      <p>{schedule.class.name}</p>
      <small>
        {schedule.coach.fullName} · {schedule.currentEnrolled}/{schedule.capacity} chỗ
      </small>
      <small>
        {canBook
          ? `${access.subscriptions.length} gói có thể dùng`
          : schedule.status === 'FULL'
            ? 'Lớp đã đầy'
            : (reasonText[access.reason] ?? access.reason)}
      </small>
      <button type="button" disabled={!canBook || busy} onClick={() => onBook(schedule.id)}>
        Đặt lớp
      </button>
    </article>
  )
}
export function CalendarPage({ week }: { week: string }) {
  const { user } = useSession(),
    cache = useQueryClient()
  const [params, setParams] = useSearchParams()
  const disciplineId = params.get('disciplineId') ?? ''
  const rawView = params.get('view') ?? 'all'
  const view: CalendarView = ['all', 'group', 'pt', 'mine'].includes(rawView)
    ? (rawView as CalendarView)
    : 'all'
  const [message, setMessage] = useState('')
  const disciplines = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => get<Discipline[]>('/disciplines', true),
  })
  const calendar = useQuery({
    queryKey: memberKeys.calendar(user!.id, week, disciplineId, view),
    queryFn: () => get<CalendarData>(`/members/me/calendar${query({ week, disciplineId, view })}`),
  })
  const invalidate = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['member', user!.id, 'calendar'] }),
      cache.invalidateQueries({ queryKey: memberKeys.subscriptions(user!.id) }),
      cache.invalidateQueries({ queryKey: memberKeys.history(user!.id) }),
    ])
  }
  const bookGroup = useMutation({
    mutationFn: (scheduleId: string) =>
      post<{ subscriptionId: string }>('/bookings/group-class', { scheduleId }),
    onSuccess: (booking) => {
      setMessage(`Đặt lớp thành công. Đã dùng gói ${booking.subscriptionId}.`)
      void invalidate()
    },
    onError: (error) => setMessage(errorText(error)),
  })
  const bookPt = useMutation({
    mutationFn: ({ slotId, discipline }: { slotId: string; discipline: string }) =>
      post<{ subscriptionId: string }>('/bookings/pt', {
        coachAvailabilityId: slotId,
        disciplineId: discipline,
      }),
    onSuccess: (booking) => {
      setMessage(`Đặt PT thành công. Đã dùng gói ${booking.subscriptionId}.`)
      void invalidate()
    },
    onError: (error) => setMessage(errorText(error)),
  })
  const cancel = useMutation({
    mutationFn: (id: string) => put(`/bookings/${id}/cancel`, {}),
    onSuccess: () => {
      setMessage('Đã hủy. Quota thực tế đang được tải lại từ máy chủ.')
      void invalidate()
    },
    onError: (error) => setMessage(errorText(error)),
  })
  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next)
  }
  return (
    <>
      <PageTitle eyebrow="MEM-08 · LỊCH TUẦN" title="Lịch tập của tôi">
        <button
          type="button"
          className="secondary"
          onClick={() => updateParam('week', shiftWeek(week, -1))}
        >
          ← Tuần trước
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => updateParam('week', mondayInVietnam())}
        >
          Tuần này
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => updateParam('week', shiftWeek(week, 1))}
        >
          Tuần sau →
        </button>
      </PageTitle>
      <p className="muted intro">
        {week} đến {addDays(week, 6)} · Thứ Hai–Chủ Nhật · giờ Việt Nam. Ngày ngoài hạn gói được
        khóa theo từng môn/gói.
      </p>
      <div className="toolbar">
        <label>
          Môn tập
          <select
            value={disciplineId}
            onChange={(event) => updateParam('disciplineId', event.target.value)}
          >
            <option value="">Tất cả môn</option>
            {disciplines.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hiển thị
          <select value={view} onChange={(event) => updateParam('view', event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="group">Lớp nhóm</option>
            <option value="pt">PT</option>
            <option value="mine">Đã đặt</option>
          </select>
        </label>
      </div>
      <StateMessage
        loading={calendar.isPending}
        error={calendar.error}
        onRetry={() => void calendar.refetch()}
      />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {calendar.data && (
        <div className="subscription-strip">
          {calendar.data.subscriptions.map((sub) => (
            <article className="subscription-chip" key={sub.id}>
              <strong>{sub.planName}</strong>
              <small>{sub.id}</small>
              <span>
                Nhóm {sub.remainingGroupSessions ?? 0} · PT {sub.remainingPtSessions ?? 0}
              </span>
            </article>
          ))}
        </div>
      )}
      <div className="week-grid">
        {calendar.data?.days.map((day, index) => (
          <section className="day-column" key={day.date}>
            <header>
              <strong>{dayName[index]}</strong>
              <span>{day.date.slice(5)}</span>
            </header>
            <div className="day-entitlements">
              {day.eligibility
                .filter((item) => !disciplineId || item.disciplineId === disciplineId)
                .map((item) => (
                  <div
                    className={`entitlement ${item.group.allowed || item.pt.allowed ? '' : 'disabled'}`}
                    key={item.subscriptionId}
                  >
                    <small>Gói {item.subscriptionId.slice(0, 8)}</small>
                    <small>
                      Nhóm {item.group.allowed ? '✓' : '–'} · PT {item.pt.allowed ? '✓' : '–'}
                    </small>
                  </div>
                ))}
            </div>
            {calendar
              .data!.schedules.filter((item) => dateInVietnam(item.startAt) === day.date)
              .map((item) => (
                <ClassCard
                  key={item.id}
                  schedule={item}
                  eligibility={day.eligibility}
                  discipline={disciplines.data?.find((d) => d.id === item.disciplineId)}
                  onBook={(id) => {
                    setMessage('')
                    bookGroup.mutate(id)
                  }}
                  busy={bookGroup.isPending || bookPt.isPending}
                />
              ))}
            {calendar
              .data!.ptSlots.filter((item) => dateInVietnam(item.startAt) === day.date)
              .map((item) => (
                <SlotCard
                  key={item.id}
                  slot={item}
                  eligibility={day.eligibility}
                  disciplineId={disciplineId}
                  disciplines={disciplines.data ?? []}
                  onBook={(slotId, discipline) => {
                    setMessage('')
                    bookPt.mutate({ slotId, discipline })
                  }}
                  busy={bookGroup.isPending || bookPt.isPending}
                />
              ))}
            {calendar
              .data!.bookings.filter(
                (item) => item.startAt && dateInVietnam(item.startAt) === day.date,
              )
              .map((item) => (
                <article className="session-card booked" key={item.id}>
                  <span className="pill">
                    ĐÃ ĐẶT · {item.bookingType === 'GROUP_CLASS' ? 'NHÓM' : 'PT'}
                  </span>
                  <strong>{item.startAt ? vietnamTime(item.startAt) : ''}</strong>
                  <small>
                    {item.status} · gói {item.subscriptionId}
                  </small>
                  {item.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={cancel.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            'Hủy lịch này? Chính sách hoàn quota do máy chủ quyết định theo thời gian bắt đầu.',
                          )
                        )
                          cancel.mutate(item.id)
                      }}
                    >
                      Hủy lịch
                    </button>
                  )}
                </article>
              ))}
            {!calendar.data!.schedules.some((item) => dateInVietnam(item.startAt) === day.date) &&
              !calendar.data!.ptSlots.some((item) => dateInVietnam(item.startAt) === day.date) &&
              !calendar.data!.bookings.some(
                (item) => item.startAt && dateInVietnam(item.startAt) === day.date,
              ) && <p className="muted no-events">Không có lịch</p>}
          </section>
        ))}
      </div>
      <p className="muted intro">
        Lịch này là gợi ý eligibility. POST đặt lịch kiểm tra lại quota, trùng giờ và slot trong
        transaction; hủy rồi đặt mới không giữ slot nguyên tử.
      </p>
    </>
  )
}
