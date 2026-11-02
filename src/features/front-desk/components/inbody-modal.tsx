import React, { type FormEvent, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memberError } from "../lib/member-error";
import { createInbodyLog, updateInbodyLog } from "../services/inbody.service";
import type { InbodyLog, UpdateInbodyLog } from "../types/inbody.types";

type Metric = "heightCm" | "weightKg" | "muscleMassKg" | "bodyFatPct" | "bmi" | "visceralFatLevel";
type FormValues = Record<Metric, string> & { notes: string };

const fields: Array<{ key: Metric; label: string; unit: string; min: number; max?: number; integer?: boolean }> = [
  { key: "heightCm", label: "Chiều cao", unit: "cm", min: 1, max: 300 },
  { key: "weightKg", label: "Cân nặng", unit: "kg", min: 1, max: 500 },
  { key: "muscleMassKg", label: "Khối lượng cơ", unit: "kg", min: 0, max: 500 },
  { key: "bodyFatPct", label: "Tỷ lệ mỡ", unit: "%", min: 0, max: 99.99 },
  { key: "bmi", label: "BMI", unit: "", min: 0, max: 99.99 },
  { key: "visceralFatLevel", label: "Mỡ nội tạng", unit: "mức", min: 0, integer: true },
];

const initialValues = (log?: InbodyLog): FormValues => ({
  heightCm: String(log?.heightCm ?? ""),
  weightKg: String(log?.weightKg ?? ""),
  muscleMassKg: String(log?.muscleMassKg ?? ""),
  bodyFatPct: String(log?.bodyFatPct ?? ""),
  bmi: String(log?.bmi ?? ""),
  visceralFatLevel: String(log?.visceralFatLevel ?? ""),
  notes: log?.notes ?? "",
});

export const InbodyModal: React.FC<{
  memberId: string;
  memberName: string;
  log?: InbodyLog;
  onClose: () => void;
  onSaved: () => void;
}> = ({ memberId, memberName, log, onClose, onSaved }) => {
  const [form, setForm] = useState<FormValues>(() => initialValues(log));
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;
    if (log && Date.now() - new Date(log.measuredAt).getTime() > 86400000) {
      setError("Phiếu đo đã quá 24 giờ, không thể chỉnh sửa.");
      return;
    }
    const values: UpdateInbodyLog = {};
    for (const field of fields) {
      const raw = form[field.key].trim();
      if (!raw) {
        if (field.key === "heightCm" || field.key === "weightKg") {
          setError(`Vui lòng nhập ${field.label.toLowerCase()}.`);
          return;
        }
        if (log) values[field.key] = null;
        continue;
      }
      const pattern = field.integer ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/;
      const value = Number(raw);
      if (!pattern.test(raw) || !Number.isFinite(value) || value < field.min || (field.max !== undefined && value > field.max)) {
        setError(`${field.label} phải nằm trong khoảng ${field.min}${field.max === undefined ? " trở lên" : `–${field.max}`}${field.integer ? " và là số nguyên" : ", tối đa 2 chữ số thập phân"}.`);
        return;
      }
      values[field.key] = value;
    }
    const notes = form.notes.trim();
    if (log) values.notes = notes || null;
    else if (notes) values.notes = notes;

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (log) await updateInbodyLog(log.id, values);
      else await createInbodyLog({ userId: memberId, heightCm: values.heightCm!, weightKg: values.weightKg!,
        muscleMassKg: values.muscleMassKg ?? undefined, bodyFatPct: values.bodyFatPct ?? undefined,
        bmi: values.bmi ?? undefined, visceralFatLevel: values.visceralFatLevel ?? undefined, notes: notes || undefined });
      onSaved();
    } catch (cause) {
      setError(memberError(cause, log ? "Không thể cập nhật phiếu đo. Vui lòng thử lại." : "Không thể lưu phiếu đo. Vui lòng thử lại."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142923]/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyRef.current) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="inbody-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[#e3eee7] pb-4">
        <div><h2 id="inbody-dialog-title" className="text-lg font-semibold text-[#172b28]">{log ? "Chỉnh sửa phiếu InBody" : "Nhập chỉ số InBody"}</h2><p className="mt-1 text-sm text-[#61756f]">{memberName}</p></div>
        <button ref={closeRef} type="button" disabled={busy} onClick={onClose} title="Đóng" aria-label="Đóng" className="rounded p-1 text-[#61756f] hover:bg-[#edf5f0] disabled:opacity-50"><X className="h-5 w-5" /></button>
      </div>
      <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-5 text-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => <label key={field.key} className="block font-medium text-[#293f37]">
            {field.label}{(field.key === "heightCm" || field.key === "weightKg") && <span className="text-[#b34031]"> *</span>}
            <div className="relative mt-1.5"><input type="number" inputMode="decimal" step={field.integer ? "1" : "0.01"} min={field.min} max={field.max} value={form[field.key]}
              onChange={(event) => { setForm((current) => ({ ...current, [field.key]: event.target.value })); setError(null); }}
              className="h-10 w-full rounded-md border border-[#cbded4] bg-white px-3 pr-12 outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15" />
              {field.unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71867b]">{field.unit}</span>}</div>
          </label>)}
        </div>
        <label className="block font-medium text-[#293f37]">Lời dặn của chuyên viên<textarea rows={3} maxLength={4000} value={form.notes} onChange={(event) => { setForm((current) => ({ ...current, notes: event.target.value })); setError(null); }} placeholder="Ghi chú kết quả đo và hướng dẫn tiếp theo" className="mt-1.5 w-full rounded-md border border-[#cbded4] p-3 outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15" /></label>
        {error && <p role="alert" className="text-[#b34031]">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#e3eee7] pt-4"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" variant="mint" disabled={busy}>{busy ? "Đang lưu..." : log ? "Lưu điều chỉnh" : "Lưu phiếu đo"}</Button></div>
      </form>
    </section>
  </div>;
};
