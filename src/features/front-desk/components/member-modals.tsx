import React, { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memberError } from "../lib/member-error";
import { changeSubscriptionStatus, updateMemberDetail } from "../services/member-management.service";
import { MemberDetail, MemberProfileUpdate } from "../types/member-management.types";
import { PosSubscription } from "../types/pos.types";

const DialogFrame: React.FC<{
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy: boolean;
}> = ({ title, children, onClose, busy }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142923]/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="member-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[#e3eee7] pb-4"><h2 id="member-dialog-title" className="text-lg font-semibold text-[#172b28]">{title}</h2><button ref={closeRef} type="button" disabled={busy} onClick={onClose} title="Đóng" aria-label="Đóng" className="rounded p-1 text-[#61756f] hover:bg-[#edf5f0] disabled:opacity-50"><X className="h-5 w-5" /></button></div>
      {children}
    </section>
  </div>;
};

export const EditMemberModal: React.FC<{
  member: MemberDetail;
  onClose: () => void;
  onSaved: (updated: MemberDetail) => void;
}> = ({ member, onClose, onSaved }) => {
  const [form, setForm] = useState<MemberProfileUpdate>({
    fullName: member.fullName,
    phone: member.phone ?? "",
    avatarUrl: member.avatarUrl ?? "",
    fitnessGoals: member.memberProfile?.fitnessGoals ?? "",
    medicalHistory: member.memberProfile?.medicalHistory ?? "",
  });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof MemberProfileUpdate, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;
    const payload = {
      fullName: form.fullName.trim(), phone: form.phone.trim(), avatarUrl: form.avatarUrl.trim(),
      fitnessGoals: form.fitnessGoals.trim(), medicalHistory: form.medicalHistory.trim(),
    };
    if (!payload.fullName) { setError("Vui lòng nhập họ tên hội viên."); return; }
    if (payload.avatarUrl) {
      try {
        const url = new URL(payload.avatarUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("invalid");
      } catch { setError("Ảnh đại diện cần là đường dẫn http hoặc https hợp lệ."); return; }
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateMemberDetail(member.id, payload);
      onSaved(updated);
    } catch (cause) {
      setError(memberError(cause, "Không thể cập nhật hồ sơ. Vui lòng thử lại."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return <DialogFrame title="Cập nhật thông tin hội viên" onClose={onClose} busy={busy}>
    <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4 text-sm">
      <label className="block font-medium">Họ tên<input value={form.fullName} maxLength={150} onChange={(event) => setField("fullName", event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#cbded4] px-3 outline-none focus:border-[#008b74]" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block font-medium">Số điện thoại<input value={form.phone} maxLength={20} onChange={(event) => setField("phone", event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#cbded4] px-3 outline-none focus:border-[#008b74]" /></label><label className="block font-medium">Email<input value={member.email} readOnly className="mt-1.5 h-10 w-full rounded-md border border-[#e0e9e4] bg-[#f5f8f6] px-3 text-[#61756f]" /></label></div>
      <label className="block font-medium">URL ảnh đại diện<input value={form.avatarUrl} maxLength={2000} onChange={(event) => setField("avatarUrl", event.target.value)} placeholder="https://..." className="mt-1.5 h-10 w-full rounded-md border border-[#cbded4] px-3 outline-none focus:border-[#008b74]" /></label>
      <label className="block font-medium">Mục tiêu tập luyện<textarea value={form.fitnessGoals} maxLength={4000} rows={2} onChange={(event) => setField("fitnessGoals", event.target.value)} className="mt-1.5 w-full rounded-md border border-[#cbded4] p-3 outline-none focus:border-[#008b74]" /></label>
      <label className="block font-medium">Tiền sử sức khỏe<textarea value={form.medicalHistory} maxLength={4000} rows={2} onChange={(event) => setField("medicalHistory", event.target.value)} className="mt-1.5 w-full rounded-md border border-[#cbded4] p-3 outline-none focus:border-[#008b74]" /></label>
      {error && <p role="alert" className="text-[#af3c2d]">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-[#e3eee7] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" variant="mint" disabled={busy}>{busy ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
    </form>
  </DialogFrame>;
};

export const SubscriptionStatusModal: React.FC<{
  subscription: PosSubscription;
  onClose: () => void;
  onSaved: () => void;
}> = ({ subscription, onClose, onSaved }) => {
  const nextStatus = subscription.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
  const freezing = nextStatus === "FROZEN";
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await changeSubscriptionStatus(subscription.id, nextStatus);
      onSaved();
    } catch (cause) {
      setError(memberError(cause, "Không thể thay đổi trạng thái gói tập. Vui lòng thử lại."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return <DialogFrame title={freezing ? "Đóng băng gói tập" : "Kích hoạt lại gói tập"} onClose={onClose} busy={busy}>
    <p className="mt-5 text-sm text-[#40564d]">{subscription.plan.name}</p>
    <p className="mt-3 text-sm text-[#40564d]">{freezing ? "Xác nhận đóng băng hợp đồng đang hoạt động?" : "Xác nhận kích hoạt lại hợp đồng đã đóng băng?"}</p>
    {error && <p role="alert" className="mt-4 text-sm text-[#af3c2d]">{error}</p>}
    <div className="mt-6 flex justify-end gap-2 border-t border-[#e3eee7] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="button" variant="mint" disabled={busy} onClick={() => void submit()}>{busy ? "Đang xử lý..." : freezing ? "Xác nhận đóng băng" : "Xác nhận kích hoạt"}</Button></div>
  </DialogFrame>;
};
