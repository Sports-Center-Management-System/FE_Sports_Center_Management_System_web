import { apiClient } from "@/services/api-client";
import { MembershipPlan, Discipline, PackageTier } from "../types/plans.types";

export interface FetchPlansParams {
  disciplineId?: string;
  packageTier?: PackageTier;
}

export const getMembershipPlansApi = async (
  params?: FetchPlansParams
): Promise<MembershipPlan[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.disciplineId && params.disciplineId !== "ALL") {
    queryParams.disciplineId = params.disciplineId;
  }
  if (params?.packageTier && params.packageTier !== ("ALL" as unknown as PackageTier)) {
    queryParams.packageTier = params.packageTier;
  }

  const response = await apiClient.get<MembershipPlan[]>("/memberships/plans", {
    params: queryParams,
  });
  return response.data;
};

export const getDisciplinesApi = async (): Promise<Discipline[]> => {
  const response = await apiClient.get<Discipline[]>("/disciplines");
  return response.data;
};
