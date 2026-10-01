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

export interface CoachPerformance {
  coachId: string;
  coachName: string;
  ptSessionsCompleted: number;
  rating: number;
}

export interface KpiReport {
  coachesPerformance: CoachPerformance[];
  roomUtilization: Record<string, string>;
}

export interface AnalyticsError {
  message: string;
  statusCode?: number;
}
