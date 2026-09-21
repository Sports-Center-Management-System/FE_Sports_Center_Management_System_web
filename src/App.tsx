import { useState } from 'react'
import type { ReactNode } from 'react'
import { MemberLayout } from './components/member/MemberLayout'
import { navigationItems, type MemberPageKey } from './mocks/memberData'
import { AiAssistant } from './pages/member/AiAssistant'
import { Notifications } from './pages/member/Notifications'
import { TrainingProgress } from './pages/member/TrainingProgress'
import './App.css'

const memberPages: Record<MemberPageKey, ReactNode> = {
  training: <TrainingProgress />,
  assistant: <AiAssistant />,
  notifications: <Notifications />,
}

function App() {
  const [activePage, setActivePage] = useState<MemberPageKey>(navigationItems[0].key)

  return (
    <MemberLayout activePage={activePage} onPageChange={setActivePage}>
      {memberPages[activePage]}
    </MemberLayout>
  )
}

export default App
