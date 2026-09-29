import { apiClient } from "@/services/api-client";
import {
  UserSubscription,
  MembershipPlan,
  Invoice,
  CheckoutResult,
} from "../types/subscriptions.types";

export const getMySubscriptionsApi = async (): Promise<UserSubscription[]> => {
  const response = await apiClient.get<UserSubscription[]>("/memberships/subscriptions");
  return response.data;
};

export const getAvailablePlansApi = async (): Promise<MembershipPlan[]> => {
  const response = await apiClient.get<MembershipPlan[]>("/memberships/plans");
  return response.data;
};

export interface CreateCheckoutPayload {
  kind: "NEW_SUBSCRIPTION" | "RENEWAL" | "PT_ADDON";
  planId?: string;
  subscriptionId?: string;
  coachId?: string;
  addonSessions?: number;
}

export const createCheckoutApi = async (
  payload: CreateCheckoutPayload
): Promise<CheckoutResult> => {
  // Generate random UUID for idempotency key
  const idempotencyKey = crypto.randomUUID();

  const response = await apiClient.post<CheckoutResult>("/billing/checkouts", payload, {
    headers: {
      "idempotency-key": idempotencyKey,
    },
  });
  return response.data;
};

export const simulatePaymentApi = async (
  paymentId: string,
  outcome: "SUCCESS" | "FAILED" = "SUCCESS"
): Promise<{ status: string; paymentId: string; outcome: string }> => {
  const response = await apiClient.post<{ status: string; paymentId: string; outcome: string }>(
    "/dev/mock-payments/simulate",
    {
      paymentId,
      outcome,
    }
  );
  return response.data;
};

export const getMyInvoicesApi = async (): Promise<Invoice[]> => {
  const response = await apiClient.get<Invoice[]>("/billing/invoices");
  return response.data;
};
