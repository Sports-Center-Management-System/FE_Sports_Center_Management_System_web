import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Unlock,
  Wrench,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { LockerItem, LockerStatus, UpdateLockerStatusPayload } from "../types";

interface LockerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateLockerStatusPayload) => void;
  locker: LockerItem | null;
}

export const LockerStatusModal: React.FC<LockerStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  locker,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LockerStatus>("AVAILABLE");
  const [memberName, setMemberName] = useState<string>("");
  const [memberPhone, setMemberPhone] = useState<string>("");
  const [maintenanceReason, setMaintenanceReason] = useState<string>("");

  useEffect(() => {
    if (locker) {
      setSelectedStatus(locker.status);
      setMemberName(locker.currentMemberName || "");
      setMemberPhone(locker.currentMemberPhone || "");
      setMaintenanceReason(locker.maintenanceReason || "");
    }
  }, [locker]);

  if (!isOpen || !locker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStatus === "OCCUPIED" && !memberName.trim()) {
      alert("Vui lòng nhập tên hội viên nhận tủ đồ!");
      return;
    }

    if (selectedStatus === "MAINTENANCE" && !maintenanceReason.trim()) {
      alert("Vui lòng ghi rõ lý do hoặc nội dung bảo trì tủ!");
      return;
    }

    onSubmit({
      lockerId: locker.id,
      status: selectedStatus,
      currentMemberName: selectedStatus === "OCCUPIED" ? memberName.trim() : undefined,
      currentMemberPhone: selectedStatus === "OCCUPIED" ? memberPhone.trim() : undefined,
      maintenanceReason: selectedStatus === "MAINTENANCE" ? maintenanceReason.trim() : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#008b74] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <div>
              <h3 className="text-lg font-bold">Đổi Trạng Thái Tủ Đồ (PUT)</h3>
              <p className="text-xs text-emerald-100 font-mono">
                Mã Tủ: {locker.code} - {locker.zoneLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Select Status Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Chọn Trạng Thái Mới <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* AVAILABLE */}
              <button
                type="button"
                onClick={() => setSelectedStatus("AVAILABLE")}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-center ${
                  selectedStatus === "AVAILABLE"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-bold shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Unlock className="h-5 w-5 mb-1 text-emerald-600" />
                <span className="text-xs">Sẵn Sàng</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Trống</span>
              </button>

              {/* OCCUPIED */}
              <button
                type="button"
                onClick={() => setSelectedStatus("OCCUPIED")}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-center ${
                  selectedStatus === "OCCUPIED"
                    ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20 font-bold shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Lock className="h-5 w-5 mb-1 text-blue-600" />
                <span className="text-xs">Đang Dùng</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Có Người</span>
              </button>

              {/* MAINTENANCE */}
              <button
                type="button"
                onClick={() => setSelectedStatus("MAINTENANCE")}
                className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all text-center ${
                  selectedStatus === "MAINTENANCE"
                    ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20 font-bold shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Wrench className="h-5 w-5 mb-1 text-amber-600" />
                <span className="text-xs">Bảo Trì</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Khóa Tủ</span>
              </button>
            </div>
          </div>

          {/* Conditional Fields based on status */}
          {selectedStatus === "AVAILABLE" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Giải phóng tủ thành công</p>
                <p className="mt-0.5 text-emerald-700">
                  Hệ thống sẽ xóa thông tin người đang giữ tủ, đặt lại mật mã khóa số và chuyển tủ về trạng thái sẵn sàng đón khách mới.
                </p>
              </div>
            </div>
          )}

          {selectedStatus === "OCCUPIED" && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Thông Tin Hội Viên Giữ Tủ
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên hội viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                  />
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại / Mã thẻ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ví dụ: 0912 345 678"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                  />
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {selectedStatus === "MAINTENANCE" && (
            <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Nội Dung Bảo Trì & Sự Cố</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do tạm dừng sử dụng tủ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 mb-2"
                >
                  <option value="">-- Chọn lý do thường gặp --</option>
                  <option value="Kẹt khóa điện tử / Liệt bàn phím cảm ứng">
                    Kẹt khóa điện tử / Liệt bàn phím cảm ứng
                  </option>
                  <option value="Pin khóa báo yếu, cần thay pin CR123A">
                    Pin khóa báo yếu, cần thay pin CR123A
                  </option>
                  <option value="Bản lề cánh tủ bị lỏng hoặc kẹt cửa">
                    Bản lề cánh tủ bị lỏng hoặc kẹt cửa
                  </option>
                  <option value="Cảm biến thẻ từ RFID không nhận diện">
                    Cảm biến thẻ từ RFID không nhận diện
                  </option>
                  <option value="Vệ sinh, khử khuẩn định kỳ">
                    Vệ sinh, khử khuẩn định kỳ
                  </option>
                </select>
                <input
                  type="text"
                  placeholder="Hoặc nhập chi tiết lý do khác..."
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#008b74] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#007461] transition-all"
            >
              Cập Nhật Trạng Thái (PUT)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
