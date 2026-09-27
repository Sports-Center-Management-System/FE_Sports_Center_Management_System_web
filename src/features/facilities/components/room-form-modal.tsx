import React, { useState, useEffect } from "react";
import { X, DoorOpen } from "lucide-react";
import {
  FacilityRoom,
  CreateRoomPayload,
  UpdateRoomPayload,
  RoomDiscipline,
  RoomStatus,
} from "../types";

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRoomPayload | UpdateRoomPayload) => void;
  editingRoom: FacilityRoom | null;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRoom,
}) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<RoomDiscipline>("GYM");
  const [floor, setFloor] = useState("Tầng 1");
  const [areaSqM, setAreaSqM] = useState(150);
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [status, setStatus] = useState<RoomStatus>("AVAILABLE");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(editingRoom);

  useEffect(() => {
    if (editingRoom) {
      setCode(editingRoom.code);
      setName(editingRoom.name);
      setDiscipline(editingRoom.discipline);
      setFloor(editingRoom.floor);
      setAreaSqM(editingRoom.areaSqM);
      setMaxCapacity(editingRoom.maxCapacity);
      setStatus(editingRoom.status);
      setDescription(editingRoom.description || "");
    } else {
      setCode(`ROOM-${Math.floor(10 + Math.random() * 90)}`);
      setName("");
      setDiscipline("GYM");
      setFloor("Tầng 1");
      setAreaSqM(120);
      setMaxCapacity(25);
      setStatus("AVAILABLE");
      setDescription("");
    }
  }, [editingRoom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên phòng tập!");
      return;
    }

    if (isEdit && editingRoom) {
      onSubmit({
        id: editingRoom.id,
        code,
        name: name.trim(),
        discipline,
        floor,
        areaSqM: Number(areaSqM),
        maxCapacity: Number(maxCapacity),
        status,
        description: description.trim() || undefined,
      } as UpdateRoomPayload);
    } else {
      onSubmit({
        code,
        name: name.trim(),
        discipline,
        floor,
        areaSqM: Number(areaSqM),
        maxCapacity: Number(maxCapacity),
        status,
        description: description.trim() || undefined,
      } as CreateRoomPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#008b74] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            <h3 className="text-lg font-bold">
              {isEdit ? "Cập Nhật Phòng Tập (PUT)" : "Thêm Phòng Tập Mới (POST)"}
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
                Mã Phòng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên Phòng Tập / Studio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Studio Yoga Thiền Định"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                required
              />
            </div>
          </div>

          {/* Discipline & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bộ Môn Phụ Trách <span className="text-rose-500">*</span>
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as RoomDiscipline)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
              >
                <option value="GYM">Gym & Thể Hình</option>
                <option value="YOGA">Yoga Studio</option>
                <option value="BOXING">Boxing & Đối Kháng</option>
                <option value="DANCING">Vũ Đạo & Dance</option>
                <option value="MULTI">Đa Năng (Studio Multi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Vị Trí Tầng <span className="text-rose-500">*</span>
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
              >
                <option value="Tầng 1">Tầng 1 (Khu sảnh chính)</option>
                <option value="Tầng 2">Tầng 2 (Khu Studio)</option>
                <option value="Tầng 3">Tầng 3 (Khu thể lực cao cấp)</option>
              </select>
            </div>
          </div>

          {/* Area & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Diện Tích (m²) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={20}
                max={1000}
                value={areaSqM}
                onChange={(e) => setAreaSqM(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sức Chứa Tối Đa (Người) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Trạng Thái Hoạt Động <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#008b74] focus:outline-none"
            >
              <option value="AVAILABLE">Sẵn sàng (Hoạt động bình thường)</option>
              <option value="MAINTENANCE">Bảo trì / Sửa chữa tạm thời</option>
              <option value="IN_USE">Đang có lớp học / Huấn luyện</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mô Tả Tiện Ích & Cơ Sở Vật Chất
            </label>
            <textarea
              rows={3}
              placeholder="Thông tin trang bị âm thanh, gương, thảm tập, hệ thống điều hòa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {isEdit ? "Lưu Thay Đổi (PUT)" : "Tạo Phòng Mới (POST)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
