import React, { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorText, get, put } from "@/lib/api";
import type { User } from "@/lib/types";

export const ProfilePage: React.FC = () => {
  const { user, verify } = useSession();
  const cache = useQueryClient();
  const profile = useQuery({
    queryKey: ["member", user!.id, "profile"],
    queryFn: () => get<User>("/users/profile/me"),
  });

  const [form, setForm] = useState<{
    fullName: string;
    phone: string;
    avatarUrl: string;
    fitnessGoals: string;
    medicalHistory: string;
    heightCm: string;
  } | null>(null);

  const current = form ?? {
    fullName: profile.data?.fullName ?? "",
    phone: profile.data?.phone ?? "",
    avatarUrl: profile.data?.avatarUrl ?? "",
    fitnessGoals: profile.data?.memberProfile?.fitnessGoals ?? "",
    medicalHistory: profile.data?.memberProfile?.medicalHistory ?? "",
    heightCm: String(profile.data?.memberProfile?.heightCm ?? ""),
  };

  const save = useMutation({
    mutationFn: () =>
      put<User>("/users/profile/me", {
        fullName: current.fullName,
        phone: current.phone,
        avatarUrl: current.avatarUrl,
        fitnessGoals: current.fitnessGoals,
        medicalHistory: current.medicalHistory,
        ...(current.heightCm ? { heightCm: Number(current.heightCm) } : {}),
      }),
    onSuccess: () => {
      setForm(null);
      void cache.invalidateQueries({ queryKey: ["member", user!.id, "profile"] });
      void verify();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <>
      <PageTitle eyebrow="MEM-10 · HỒ SƠ" title="Thông tin cá nhân" />
      <StateMessage loading={profile.isPending} error={profile.error} />
      <form className="card form-stack form-wide" onSubmit={submit}>
        <p className="muted text-xs text-slate-500 mb-2">{profile.data?.email}</p>
        <label className="text-xs font-bold block mb-1">
          Họ tên
          <Input
            required
            value={current.fullName}
            onChange={(event) => setForm({ ...current, fullName: event.target.value })}
            className="mt-1"
          />
        </label>
        <label className="text-xs font-bold block mb-1">
          Số điện thoại
          <Input
            required
            value={current.phone}
            onChange={(event) => setForm({ ...current, phone: event.target.value })}
            className="mt-1"
          />
        </label>
        <label className="text-xs font-bold block mb-1">
          Ảnh đại diện (URL)
          <Input
            value={current.avatarUrl}
            onChange={(event) => setForm({ ...current, avatarUrl: event.target.value })}
            className="mt-1"
          />
        </label>
        <label className="text-xs font-bold block mb-1">
          Chiều cao (cm)
          <Input
            type="number"
            min="1"
            max="300"
            step="0.1"
            value={current.heightCm}
            onChange={(event) => setForm({ ...current, heightCm: event.target.value })}
            className="mt-1"
          />
        </label>
        <label className="text-xs font-bold block mb-1">
          Mục tiêu
          <textarea
            value={current.fitnessGoals}
            onChange={(event) => setForm({ ...current, fitnessGoals: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-xs"
          />
        </label>
        <label className="text-xs font-bold block mb-1">
          Thông tin sức khỏe
          <textarea
            value={current.medicalHistory}
            onChange={(event) => setForm({ ...current, medicalHistory: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-xs"
          />
        </label>

        <div className="pt-2">
          <Button type="submit" variant="mint" disabled={save.isPending || !profile.data}>
            {save.isPending ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </div>

        {save.isSuccess && (
          <p role="status" className="notice success text-xs mt-2">
            Đã lưu hồ sơ thành công.
          </p>
        )}
        {save.error && (
          <p role="alert" className="text-error text-xs mt-2">
            {errorText(save.error)}
          </p>
        )}
      </form>
    </>
  );
};

export default ProfilePage;
