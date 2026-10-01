import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../auth/session-context'
import { PageTitle, StateMessage } from '../components/Layout'
import { errorText, get, put } from '../lib/api'
import { vietnamTime } from '../lib/date'
import { memberKeys } from '../lib/keys'
import type {
  Attendance,
  Booking,
  InbodyLog,
  LockerAssignment,
  User,
  WorkoutPlan,
} from '../lib/types'

export function HistoryPage() {
  const { user } = useSession()
  const bookings = useQuery({
    queryKey: memberKeys.history(user!.id),
    queryFn: () => get<Booking[]>('/bookings'),
  })
  const attendances = useQuery({
    queryKey: ['member', user!.id, 'attendances'],
    queryFn: () => get<Attendance[]>('/attendances'),
  })
  const workouts = useQuery({
    queryKey: ['member', user!.id, 'workouts'],
    queryFn: () => get<WorkoutPlan[]>('/workout-plans'),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-09 · LỊCH SỬ" title="Hoạt động tập luyện" />
      <p className="muted intro">
        API hiện trả tối đa 200 booking/điểm danh và 100 giáo án; chưa có phân trang vô hạn.
      </p>
      <div className="three-column">
        <section className="card">
          <h2>Đặt lịch</h2>
          <StateMessage
            loading={bookings.isPending}
            error={bookings.error}
            empty={bookings.data?.length === 0}
          />
          {bookings.data?.map((item) => (
            <div className="history-item" key={item.id}>
              <strong>
                {item.bookingType === 'GROUP_CLASS'
                  ? (item.schedule?.class?.name ?? 'Lớp nhóm')
                  : 'Buổi PT'}
              </strong>
              <small>
                {item.schedule?.startTime || item.coachAvailability?.startTime
                  ? vietnamTime(item.schedule?.startTime ?? item.coachAvailability!.startTime)
                  : vietnamTime(item.bookedAt)}
              </small>
              <small>
                {item.status} · gói {item.subscriptionId}
              </small>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Điểm danh</h2>
          <StateMessage
            loading={attendances.isPending}
            error={attendances.error}
            empty={attendances.data?.length === 0}
          />
          {attendances.data?.map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.status ?? 'Check-in'}</strong>
              <small>{item.checkInTime ? vietnamTime(item.checkInTime) : '—'}</small>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Giáo án gần đây</h2>
          <StateMessage
            loading={workouts.isPending}
            error={workouts.error}
            empty={workouts.data?.length === 0}
          />
          {workouts.data?.slice(0, 10).map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.title}</strong>
              <small>
                {vietnamTime(item.createdAt)} · {item.exercises?.length ?? 0} bài tập
              </small>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
export function ProfilePage() {
  const { user, verify } = useSession()
  const cache = useQueryClient()
  const profile = useQuery({
    queryKey: ['member', user!.id, 'profile'],
    queryFn: () => get<User>('/users/profile/me'),
  })
  const [form, setForm] = useState<{
    fullName: string
    phone: string
    avatarUrl: string
    fitnessGoals: string
    medicalHistory: string
    heightCm: string
  } | null>(null)
  const current = form ?? {
    fullName: profile.data?.fullName ?? '',
    phone: profile.data?.phone ?? '',
    avatarUrl: profile.data?.avatarUrl ?? '',
    fitnessGoals: profile.data?.memberProfile?.fitnessGoals ?? '',
    medicalHistory: profile.data?.memberProfile?.medicalHistory ?? '',
    heightCm: String(profile.data?.memberProfile?.heightCm ?? ''),
  }
  const save = useMutation({
    mutationFn: () =>
      put<User>('/users/profile/me', {
        fullName: current.fullName,
        phone: current.phone,
        avatarUrl: current.avatarUrl,
        fitnessGoals: current.fitnessGoals,
        medicalHistory: current.medicalHistory,
        ...(current.heightCm ? { heightCm: Number(current.heightCm) } : {}),
      }),
    onSuccess: () => {
      setForm(null)
      void cache.invalidateQueries({ queryKey: ['member', user!.id, 'profile'] })
      void verify()
    },
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }
  return (
    <>
      <PageTitle eyebrow="MEM-10 · HỒ SƠ" title="Thông tin cá nhân" />
      <StateMessage loading={profile.isPending} error={profile.error} />
      <form className="card form-stack form-wide" onSubmit={submit}>
        <p className="muted">{profile.data?.email}</p>
        <label>
          Họ tên
          <input
            required
            value={current.fullName}
            onChange={(event) => setForm({ ...current, fullName: event.target.value })}
          />
        </label>
        <label>
          Số điện thoại
          <input
            required
            value={current.phone}
            onChange={(event) => setForm({ ...current, phone: event.target.value })}
          />
        </label>
        <label>
          Ảnh đại diện (URL)
          <input
            value={current.avatarUrl}
            onChange={(event) => setForm({ ...current, avatarUrl: event.target.value })}
          />
        </label>
        <label>
          Chiều cao (cm)
          <input
            type="number"
            min="1"
            max="300"
            step="0.1"
            value={current.heightCm}
            onChange={(event) => setForm({ ...current, heightCm: event.target.value })}
          />
        </label>
        <label>
          Mục tiêu
          <textarea
            value={current.fitnessGoals}
            onChange={(event) => setForm({ ...current, fitnessGoals: event.target.value })}
          />
        </label>
        <label>
          Thông tin sức khỏe
          <textarea
            value={current.medicalHistory}
            onChange={(event) => setForm({ ...current, medicalHistory: event.target.value })}
          />
        </label>
        <button type="submit" disabled={save.isPending || !profile.data}>
          Lưu hồ sơ
        </button>
        {save.isSuccess && (
          <p role="status" className="notice success">
            Đã lưu hồ sơ.
          </p>
        )}
        {save.error && (
          <p role="alert" className="text-error">
            {errorText(save.error)}
          </p>
        )}
      </form>
    </>
  )
}
export function ProgressPage() {
  const { user } = useSession()
  const progress = useQuery({
    queryKey: ['member', user!.id, 'progress'],
    queryFn: () => get<{ logs: InbodyLog[] }>('/inbody/my-progress'),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-11 · INBODY" title="Chỉ số cơ thể" />
      <StateMessage
        loading={progress.isPending}
        error={progress.error}
        empty={progress.data?.logs.length === 0}
      />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ngày đo</th>
              <th>Cân nặng</th>
              <th>Mỡ cơ thể</th>
              <th>Cơ</th>
              <th>BMI</th>
            </tr>
          </thead>
          <tbody>
            {progress.data?.logs.map((item) => (
              <tr key={item.id}>
                <td>{vietnamTime(item.measuredAt)}</td>
                <td>{item.weightKg ?? '—'} kg</td>
                <td>{item.bodyFatPct ?? '—'}%</td>
                <td>{item.muscleMassKg ?? '—'} kg</td>
                <td>{item.bmi ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
export function WorkoutPlansPage() {
  const { user } = useSession()
  const plans = useQuery({
    queryKey: ['member', user!.id, 'workouts'],
    queryFn: () => get<WorkoutPlan[]>('/workout-plans'),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-12 · GIÁO ÁN" title="Bài tập của tôi" />
      <p className="muted intro">Danh sách hiện có tối đa 100 giáo án từ API.</p>
      <StateMessage
        loading={plans.isPending}
        error={plans.error}
        empty={plans.data?.length === 0}
      />
      <div className="card-grid">
        {plans.data?.map((item) => (
          <article className="card" key={item.id}>
            <span className="pill">{vietnamTime(item.createdAt)}</span>
            <h2>{item.title}</h2>
            <ul>
              {item.exercises?.map((entry) => (
                <li key={entry.id}>
                  {entry.exercise?.name ?? 'Bài tập'}
                  {entry.sets ? ` · ${entry.sets} hiệp` : ''}
                  {entry.reps ? ` × ${entry.reps}` : ''}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  )
}
export function AttendancesPage() {
  const { user } = useSession()
  const rows = useQuery({
    queryKey: ['member', user!.id, 'attendances'],
    queryFn: () => get<Attendance[]>('/attendances'),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-13 · ĐIỂM DANH" title="Lịch sử điểm danh" />
      <p className="muted intro">API trả tối đa 200 bản ghi gần nhất.</p>
      <StateMessage loading={rows.isPending} error={rows.error} empty={rows.data?.length === 0} />
      <div className="list">
        {rows.data?.map((item) => (
          <article className="list-row" key={item.id}>
            <strong>{item.checkInTime ? vietnamTime(item.checkInTime) : '—'}</strong>
            <span>{item.status ?? 'Check-in'}</span>
          </article>
        ))}
      </div>
    </>
  )
}
export function LockersPage() {
  const { user } = useSession(),
    cache = useQueryClient()
  const rows = useQuery({
    queryKey: ['member', user!.id, 'lockers'],
    queryFn: () => get<LockerAssignment[]>('/lockers/my-assignments'),
  })
  const giveBack = useMutation({
    mutationFn: (id: string) => put(`/lockers/assignments/${id}/return`, {}),
    onSuccess: () => void cache.invalidateQueries({ queryKey: ['member', user!.id, 'lockers'] }),
  })
  return (
    <>
      <PageTitle eyebrow="MEM-14 · TỦ ĐỒ" title="Tủ đang sử dụng" />
      <StateMessage loading={rows.isPending} error={rows.error} empty={rows.data?.length === 0} />
      <div className="card-grid">
        {rows.data?.map((item) => (
          <article className="card" key={item.id}>
            <span className="pill">{item.locker.zone}</span>
            <h2>{item.locker.lockerNumber}</h2>
            <p>Nhận tủ: {vietnamTime(item.assignedAt)}</p>
            <button
              type="button"
              disabled={giveBack.isPending}
              onClick={() => {
                if (window.confirm('Xác nhận trả tủ?')) giveBack.mutate(item.id)
              }}
            >
              Trả tủ
            </button>
          </article>
        ))}
      </div>
      {giveBack.error && (
        <p role="alert" className="text-error">
          {errorText(giveBack.error)}
        </p>
      )}
    </>
  )
}
