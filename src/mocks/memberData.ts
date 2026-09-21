export type MemberPageKey = 'training' | 'assistant' | 'notifications'

export interface NavigationItem {
  key: MemberPageKey
  label: string
  icon: string
}

export interface WorkoutSession {
  date: string
  title: string
  coach: string
  time: string
  attendance: 'Có mặt' | 'Vắng' | 'Sắp tới'
  rating: string
}

export interface NotificationItem {
  title: string
  message: string
  time: string
  type: 'booking' | 'schedule' | 'feedback' | 'membership'
  unread?: boolean
}

export interface ChatMessage {
  sender: 'member' | 'assistant'
  text: string
}

export const navigationItems: NavigationItem[] = [
  { key: 'training', label: 'Training & Progress', icon: 'TP' },
  { key: 'notifications', label: 'Notifications', icon: 'NO' },
]

export const workoutSessions: WorkoutSession[] = [
  {
    date: 'Thứ 2, 24/10',
    title: 'Personal Training - Core & Cardio',
    coach: 'Trần Văn Hoàng',
    time: '08:30 - 09:30',
    attendance: 'Có mặt',
    rating: '4.8/5',
  },
  {
    date: 'Thứ 4, 26/10',
    title: 'Yoga trị liệu cột sống',
    coach: 'Mai Anh',
    time: '18:30 - 19:30',
    attendance: 'Có mặt',
    rating: '5/5',
  },
  {
    date: 'Thứ 6, 28/10',
    title: 'Upper Body Strength',
    coach: 'Trần Văn Hoàng',
    time: '07:00 - 08:00',
    attendance: 'Sắp tới',
    rating: 'Chưa đánh giá',
  },
]

export const notifications: NotificationItem[] = [
  {
    title: 'Xác nhận lịch tập',
    message: 'Buổi Personal Training - Core & Cardio đã được đặt thành công.',
    time: '10 phút trước',
    type: 'booking',
    unread: true,
  },
  {
    title: 'Thay đổi phòng tập',
    message: 'Lớp Yoga trị liệu cột sống chuyển sang Phòng Studio 2.',
    time: '1 giờ trước',
    type: 'schedule',
    unread: true,
  },
  {
    title: 'Feedback từ Coach',
    message: 'Coach Trần Văn Hoàng đã gửi nhận xét sau buổi tập gần nhất.',
    time: 'Hôm qua',
    type: 'feedback',
  },
  {
    title: 'Gói tập sắp hết hạn',
    message: 'Elite Wellness Platinum sẽ hết hạn vào ngày 12/12/2026.',
    time: '2 ngày trước',
    type: 'membership',
  },
]

export const chatMessages: ChatMessage[] = [
  {
    sender: 'assistant',
    text: 'Chào Khang, hôm nay bạn muốn hỏi về lịch tập, kỹ thuật động tác hay dinh dưỡng?',
  },
  {
    sender: 'member',
    text: 'Tôi nên tập gì sau buổi cardio hôm qua?',
  },
  {
    sender: 'assistant',
    text: 'Bạn nên ưu tiên phục hồi chủ động: 10 phút giãn cơ, bài core nhẹ và giữ nhịp tim vừa phải. Nếu còn đau cơ, hãy giảm tải phần thân dưới.',
  },
]
