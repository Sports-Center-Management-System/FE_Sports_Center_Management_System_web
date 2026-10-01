import { SearchMember } from "./gate-checkin.types";
import { PosInvoice } from "./pos.types";

export interface MemberDetail extends SearchMember {
  role: "MEMBER";
  memberProfile: {
    fitnessGoals: string | null;
    medicalHistory: string | null;
    heightCm: number | string | null;
  } | null;
}

export interface MemberProfileUpdate {
  fullName: string;
  phone: string;
  avatarUrl: string;
  fitnessGoals: string;
  medicalHistory: string;
}

export type MemberInvoice = Omit<PosInvoice, "paymentMethod"> & {
  paymentMethod: string;
  subscription: { userId: string; planId: string };
};
