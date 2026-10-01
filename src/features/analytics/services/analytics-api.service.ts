import apiClient from "@/services/api-client";
import { KpiReport, RevenueReport } from "@/features/analytics/types/analytics.types";

export const getRevenueReport = async (): Promise<RevenueReport> => {
  const response = await apiClient.get<RevenueReport>("/analytics/revenue");
  return response.data;
};

export const getKpiReport = async (): Promise<KpiReport> => {
  const response = await apiClient.get<KpiReport>("/analytics/kpi");
  return response.data;
};
