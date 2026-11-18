import type { MemberGender, SearchMember } from "./gate-checkin.types";
import type { PosInvoice } from "./pos.types";

export interface MemberDetail extends SearchMember {
  role: "MEMBER";
  memberProfile: {
    fitnessGoals: string | null;
    medicalHistory: string | null;
    heightCm: number | string | null;
  } | null;
}

/** Body of PUT /users/members/:id. The backend rejects fields outside this list (no avatarUrl). */
export interface MemberProfileUpdate {
  fullName: string;
  phone: string;
  gender?: MemberGender;
  heightCm?: number;
  fitnessGoals: string;
  medicalHistory: string;
}

export interface CreateMemberPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  gender?: MemberGender;
  avatarUrl?: string;
}

export type MemberInvoice = Omit<PosInvoice, "paymentMethod"> & {
  paymentMethod: string;
  subscription: { userId: string; planId: string };
};
