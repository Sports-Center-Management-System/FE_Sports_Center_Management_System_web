import { notifications } from '../../mocks/memberData'

export function Notifications() {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <span className="eyebrow">Notifications</span>
          <h1>Thông báo của bạn</h1>
        </div>
      </div>

      <article className="panel notification-panel">
        <div className="panel-header">
          <h2>Cập nhật gần đây</h2>
          <span>Booking, thay đổi lịch, feedback và gói tập</span>
        </div>
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
              className={`notification-item ${notification.unread ? 'unread' : ''}`}
              key={`${notification.type}-${notification.title}`}
            >
              <div className={`notification-icon ${notification.type}`}>
                {notification.type.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
              <span>{notification.time}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
