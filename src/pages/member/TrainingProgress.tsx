import { Metric } from '../../components/member/Metric'
import { StatCard } from '../../components/member/StatCard'
import { workoutSessions } from '../../mocks/memberData'

export function TrainingProgress() {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <span className="eyebrow">Training & Progress</span>
          <h1>Lịch sử tập luyện và tiến độ</h1>
        </div>
        <button className="primary-button" type="button">
          Gửi feedback Coach
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Buổi đã hoàn thành" value="18" helper="/ 24 buổi" />
        <StatCard label="Tỷ lệ attendance" value="92%" helper="Tháng 10/2026" />
        <StatCard label="Điểm tiến bộ" value="+14%" helper="So với 4 tuần trước" />
        <StatCard label="Rating trung bình" value="4.9" helper="/ 5 sau session" />
      </div>

      <div className="content-grid">
        <article className="panel wide">
          <div className="panel-header">
            <h2>Nhật ký buổi tập</h2>
            <span>Workout, attendance, kết quả</span>
          </div>
          <div className="session-list">
            {workoutSessions.map((session) => (
              <div className="session-row" key={`${session.date}-${session.title}`}>
                <div className="date-badge">{session.date}</div>
                <div>
                  <strong>{session.title}</strong>
                  <span>
                    {session.time} · Coach {session.coach}
                  </span>
                </div>
                <div className="status-pill">{session.attendance}</div>
                <div className="rating">{session.rating}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Kết quả hiện tại</h2>
            <span>Cập nhật sau session</span>
          </div>
          <div className="metric-list">
            <Metric label="BMI" value="22.4" />
            <Metric label="Body fat" value="14.8%" />
            <Metric label="Khối lượng cơ" value="36.2 kg" />
          </div>
        </article>
      </div>
    </section>
  )
}
