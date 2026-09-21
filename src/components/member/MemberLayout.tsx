import type { ReactNode } from 'react'
import { navigationItems, type MemberPageKey } from '../../mocks/memberData'

interface MemberLayoutProps {
  activePage: MemberPageKey
  children: ReactNode
  onPageChange: (page: MemberPageKey) => void
}

export function MemberLayout({
  activePage,
  children,
  onPageChange,
}: MemberLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">W</div>
          <div>
            <strong>Dạo mê WDP</strong>
            <span>Sports & Wellness</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Member screens">
          {navigationItems.map((item) => (
            <button
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => onPageChange(item.key)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className={`coach-card ${activePage === 'assistant' ? 'active' : ''}`}
          type="button"
          onClick={() => onPageChange('assistant')}
        >
          <div className="avatar small">VH</div>
          <div>
            <strong>AI Wellness Coach</strong>
            <span>Trực tuyến 24/7</span>
          </div>
        </button>
      </aside>

      <main className="main-content">
        <MemberTopbar />
        {children}
      </main>
    </div>
  )
}

function MemberTopbar() {
  return (
    <header className="topbar">
      <div className="search">Tìm kiếm bài tập, huấn luyện viên...</div>
      <button className="icon-button" type="button" aria-label="Thông báo">
        !
      </button>
      <div className="profile-chip">
        <div>
          <strong>Nguyễn Minh Khang</strong>
          <span>Thành viên Premium</span>
        </div>
        <div className="avatar">MK</div>
      </div>
    </header>
  )
}
