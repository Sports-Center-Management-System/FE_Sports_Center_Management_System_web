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
// src/mocks/memberData.ts

// --- Types ---
export interface CurrentPackage {
  name: string;
  totalSessions: number | "unlimited";
  usedSessions: number;
  expireDate: string;
}

export interface Booking {
  id: number;
  date: string;
  time: string;
  subject: string;
  coach: string;
  room: string;
}

export interface Announcement {
  id: number;
  type: "warning" | "info";
  message: string;
}

export interface TrainingPackage {
  id: string;
  name: string;
  price: number;
  durationInMonths: number;
  sessions: number | "Không giới hạn";
  benefits: string[];
  coachPolicy: string;
  isPopular: boolean;
}

// --- Mock Data ---
export const mockHomeData = {
  currentPackage: {
    name: "Gói Premium 12 Tháng",
    totalSessions: 100,
    usedSessions: 45,
    expireDate: "2024-12-31",
  } as CurrentPackage,
  upcomingBookings: [
    {
      id: 1,
      date: "Hôm nay",
      time: "18:00",
      subject: "Zumba",
      coach: "HLV Mai",
      room: "Studio 1",
    },
    {
      id: 2,
      date: "Ngày mai",
      time: "19:00",
      subject: "Kickboxing",
      coach: "HLV Tuấn",
      room: "Ring 1",
    },
  ] as Booking[],
  announcements: [
    {
      id: 1,
      type: "warning",
      message: "Gói tập của bạn sẽ hết hạn trong 15 ngày tới.",
    },
    {
      id: 2,
      type: "info",
      message: "Lớp Yoga Cơ Bản ngày mai sẽ chuyển sang Studio 2.",
    },
  ] as Announcement[],
};

export const mockProfileData = {
  personalInfo: {
    memberId: "MEM-88291",
    fullName: "Nguyễn Văn Hội Viên",
    phone: "0901234567",
    email: "hoivien@gmail.com",
    dob: "1998-05-15",
    joinDate: "15/01/2024",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    address: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
  },
  physicalInfo: {
    height: 175,
    weight: 70,
    bmi: 22.9,
    targetGoal: "Tăng cơ giảm mỡ & Cải thiện sức bền",
    medicalNotes: "Không có tiền sử bệnh lý nguy hiểm.",
    workoutFrequency: "4 buổi / tuần",
  },
  membershipSummary: {
    packageName: "Gói Premium 12 Tháng",
    status: "Đang hoạt động",
    remainingSessions: 55,
    totalSessions: 100,
    expireDate: "31/12/2026",
  },
};

export const mockPackages: TrainingPackage[] = [
  {
    id: "pkg-1",
    name: "Gói Cơ Bản",
    price: 500000,
    durationInMonths: 1,
    sessions: 12,
    benefits: [
      "Sử dụng phòng Gym cơ bản",
      "Tủ đồ cá nhân",
      "1 buổi PT miễn phí",
    ],
    coachPolicy: "Không kèm Coach",
    isPopular: false,
  },
  {
    id: "pkg-2",
    name: "Gói Pro (Gợi ý)",
    price: 2500000,
    durationInMonths: 6,
    sessions: "Không giới hạn",
    benefits: ["Full tiện ích", "Bể bơi, Xông hơi", "Tham gia mọi lớp Group X"],
    coachPolicy: "Được chọn Coach cho 10 buổi đầu",
    isPopular: true,
  },
  {
    id: "pkg-3",
    name: "Gói Nac (Gợi ý)",
    price: 2500000,
    durationInMonths: 6,
    sessions: "Không giới hạn",
    benefits: ["Full tiện ích", "Bể bơi, Xông hơi", "Tham gia mọi lớp Group X"],
    coachPolicy: "Được chọn Coach cho 10 buổi đầu",
    isPopular: false,
  },
];
