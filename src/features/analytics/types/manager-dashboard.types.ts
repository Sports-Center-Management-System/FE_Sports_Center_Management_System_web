// Types for Executive Center Manager Dashboard

export interface RevenueMetric {
  totalAmount: number;
  baseAmount: number; // Doanh thu gói cơ bản (Gym, Yoga, Pool)
  ptAmount: number;   // Doanh thu Huấn luyện viên cá nhân (PT 1-1)
  growthPercent: number;
  targetAmount?: number;
  achievementPercent?: number;
}

export interface RevenueBreakdownPoint {
  date: string;       // e.g. "20/09"
  dayLabel: string;   // e.g. "T2", "T3"
  baseAmount: number; // in VND (millions or actual)
  ptAmount: number;
  total: number;
}

export interface NewMemberGrowth {
  todayCount: number;
  monthCount: number;
  growthRate: number; // e.g. +14.8%
  activeTotal: number;
  packageBreakdown: {
    packageName: string;
    count: number;
    percentage: number;
  }[];
}

export interface ZoneOccupancy {
  id: string;
  name: string;
  currentCount: number;
  maxCapacity: number;
  occupancyRate: number; // 0 - 100%
  status: "NORMAL" | "BUSY" | "OVERLOAD";
}

export interface HourlyTrafficPoint {
  hour: string; // e.g. "06:00", "08:00"
  headcount: number;
  isPeak: boolean;
}

export interface RealtimeOccupancyData {
  totalCurrent: number;
  totalCapacity: number;
  overallRate: number;
  peakStatus: "LOW" | "MODERATE" | "PEAK";
  zones: ZoneOccupancy[];
  hourlyTraffic: HourlyTrafficPoint[];
}

export type LockerZoneType = "MALE" | "FEMALE" | "VIP";
export type LockerStatus = "OCCUPIED" | "AVAILABLE" | "MAINTENANCE";

export interface LockerItem {
  id: string;
  code: string;
  zone: LockerZoneType;
  status: LockerStatus;
  occupiedSince?: string;
  memberName?: string;
}

export interface LockerZoneSummary {
  zone: LockerZoneType;
  label: string;
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  utilizationRate: number;
}

export interface StaffOnDuty {
  id: string;
  employeeCode: string;
  fullName: string;
  role: "HEAD_COACH" | "PT_TRAINER" | "RECEPTIONIST" | "LIFEGUARD" | "TECHNICIAN";
  roleLabel: string;
  department: string;
  avatarUrl: string;
  shift: string; // e.g. "Ca 1 (06:00 - 14:00)"
  status: "ON_SHIFT" | "UPCOMING" | "ON_LEAVE";
  statusLabel: string;
  ptSessionsToday?: number;
  phone: string;
}

export interface ManagerDashboardData {
  todayRevenue: RevenueMetric;
  monthlyRevenue: RevenueMetric;
  memberGrowth: NewMemberGrowth;
  occupancy: RealtimeOccupancyData;
  lockersSummary: {
    totalLockers: number;
    totalOccupied: number;
    totalRate: number;
    zones: LockerZoneSummary[];
    recentLockers: LockerItem[];
  };
  staffOnDuty: StaffOnDuty[];
  lastUpdated: string;
}
