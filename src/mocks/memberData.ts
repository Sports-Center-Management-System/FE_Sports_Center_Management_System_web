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
