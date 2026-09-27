import React, { useState, useEffect } from "react";
import { X, Dumbbell } from "lucide-react";
import {
  FacilityEquipment,
  FacilityRoom,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  EquipmentCategory,
  EquipmentCondition,
} from "../types";

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateEquipmentPayload | UpdateEquipmentPayload) => void;
  editingEquipment: FacilityEquipment | null;
  rooms: FacilityRoom[];
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEquipment,
  rooms,
}) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("CARDIO");
  const [roomId, setRoomId] = useState<string>(rooms[0]?.id || "");
  const [brand, setBrand] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("2025-01-15");
  const [warrantyExpiry, setWarrantyExpiry] = useState("2028-01-15");
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("2026-08-10");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("2026-11-10");
  const [conditionStatus, setConditionStatus] = useState<EquipmentCondition>("OPERATIONAL");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const isEdit = Boolean(editingEquipment);

  useEffect(() => {
    if (editingEquipment) {
      setCode(editingEquipment.code);
      setName(editingEquipment.name);
      setCategory(editingEquipment.category);
      setRoomId(editingEquipment.roomId);
      setBrand(editingEquipment.brand);
      setPurchaseDate(editingEquipment.purchaseDate);
      setWarrantyExpiry(editingEquipment.warrantyExpiry);
      setLastMaintenanceDate(editingEquipment.lastMaintenanceDate);
      setNextMaintenanceDate(editingEquipment.nextMaintenanceDate);
      setConditionStatus(editingEquipment.conditionStatus);
      setQuantity(editingEquipment.quantity);
      setNotes(editingEquipment.notes || "");
    } else {
      setCode(`EQ-${Math.floor(100 + Math.random() * 900)}`);
      setName("");
      setCategory("CARDIO");
      setRoomId(rooms[0]?.id || "");
      setBrand("LifeFitness");
      setPurchaseDate("2025-01-01");
      setWarrantyExpiry("2028-01-01");
      setLastMaintenanceDate("2026-09-01");
      setNextMaintenanceDate("2026-12-01");
      setConditionStatus("OPERATIONAL");
      setQuantity(1);
      setNotes("");
    }
  }, [editingEquipment, isOpen, rooms]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên thiết bị!");
      return;
    }

    if (isEdit && editingEquipment) {
      onSubmit({
        id: editingEquipment.id,
        code,
        name: name.trim(),
        category,
        roomId,
        brand: brand.trim(),
        purchaseDate,
        warrantyExpiry,
        lastMaintenanceDate,
        nextMaintenanceDate,
        conditionStatus,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      } as UpdateEquipmentPayload);
    } else {
      onSubmit({
        code,
        name: name.trim(),
        category,
        roomId,
        brand: brand.trim(),
        purchaseDate,
        warrantyExpiry,
        lastMaintenanceDate,
        nextMaintenanceDate,
        conditionStatus,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      } as CreateEquipmentPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#008b74] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            <h3 className="text-lg font-bold">
              {isEdit ? "Cập Nhật Máy Tập / Thiết Bị (PUT)" : "Thêm Thiết Bị Mới (POST)"}
            </h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mã Thiết Bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên Máy Tập / Thiết Bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Máy Chạy Bộ LifeFitness Platinum"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Category & Room Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nhóm Phân Loại <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
              >
                <option value="CARDIO">Máy Cardio (Chạy bộ, Xe đạp...)</option>
                <option value="STRENGTH">Máy Khối Cơ Lực (Smith, Cable...)</option>
                <option value="FREE_WEIGHTS">Tạ Tự Do (Dumbbell, Barbell...)</option>
                <option value="COMBAT">Thiết Bị Võ Thuật (Bao cát, Đài...)</option>
                <option value="ACCESSORY">Dụng Cụ Phụ Trợ (TRX, Lụa Yoga...)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phòng Tập Bố Trí <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hãng Sản Xuất / Thương Hiệu
              </label>
              <input
                type="text"
                placeholder="Ví dụ: LifeFitness, Matrix, Technogym"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Số Lượng Máy / Thiết Bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>
          </div>

          {/* Condition Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tình Trạng Vận Hành <span className="text-rose-500">*</span>
            </label>
            <select
              value={conditionStatus}
              onChange={(e) => setConditionStatus(e.target.value as EquipmentCondition)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
            >
              <option value="OPERATIONAL">Hoạt động tốt (100% Sẵn sàng)</option>
              <option value="NEEDS_SERVICE">Cần bảo dưỡng định kỳ / Mòn nhẹ</option>
              <option value="MAINTENANCE">Đang tạm ngưng để sửa chữa</option>
            </select>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bảo Dưỡng Gần Nhất
              </label>
              <input
                type="date"
                value={lastMaintenanceDate}
                onChange={(e) => setLastMaintenanceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kỳ Bảo Dưỡng Kế Tiếp
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Thông Số Kỹ Thuật & Ghi Chú Vận Hành
            </label>
            <textarea
              rows={2}
              placeholder="Thông số động cơ, tải trọng, tình trạng dây cáp, chốt khóa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#008b74] focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              {isEdit ? "Lưu Thiết Bị (PUT)" : "Thêm Thiết Bị (POST)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
