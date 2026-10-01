export type DisciplineFilter = "ALL" | "BOXING" | "YOGA" | "GYM" | "DANCING";

export interface ReportFilters {
  fromDate: string;
  toDate: string;
  discipline: DisciplineFilter;
  membershipTier: string;
}

export interface RevenueReport {
  totalRevenue: number;
  baseRevenue: number;
  ptRevenue: number;
  byDiscipline?: Record<string, number>;
}

export interface CoachKpi {
  id: string;
  fullName: string;
  _count: {
    coachedSchedules: number;
    coachAvailabilities: number;
  };
  coachProfile: {
    monthlyEmergencyCancellations: number;
    emergencyCancellationCount: number;
  } | null;
}

export interface RoomKpi {
  id: string;
  name: string;
  totalScheduledHours: number;
}

export interface KpiReport {
  coaches: CoachKpi[];
  rooms: RoomKpi[];
}

export interface AnalyticsError {
  message: string;
  statusCode?: number;
}
