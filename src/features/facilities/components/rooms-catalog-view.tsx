import React, { useState, useMemo } from "react";
import {
  DoorOpen,
  Plus,
  Search,
  Maximize2,
  Users,
  Dumbbell,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Building,
} from "lucide-react";
import { FacilityRoom, RoomDiscipline } from "../types";

interface RoomsCatalogViewProps {
  rooms: FacilityRoom[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (room: FacilityRoom) => void;
}

export const RoomsCatalogView: React.FC<RoomsCatalogViewProps> = ({
  rooms,
  onOpenCreateModal,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedDiscipline !== "ALL" && r.discipline !== selectedDiscipline) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.code.toLowerCase().includes(q);
        const matchName = r.name.toLowerCase().includes(q);
        const matchFloor = r.floor.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchFloor) return false;
      }
      return true;
    });
  }, [rooms, selectedDiscipline, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng, mã số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* Discipline Filter */}
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:outline-none"
          >
            <option value="ALL">Tất cả bộ môn</option>
            <option value="GYM">Gym & Thể Hình</option>
            <option value="YOGA">Yoga Studio</option>
            <option value="BOXING">Boxing & Đối Kháng</option>
            <option value="DANCING">Vũ Đạo & Dance</option>
            <option value="MULTI">Studio Đa Năng</option>
          </select>
        </div>

        {/* Add Room Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#008b74] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#007461] transition-all"
        >
          <Plus className="h-4 w-4" />
          Thêm Phòng Mới (POST)
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const isAvailable = room.status === "AVAILABLE";
          const isMaintenance = room.status === "MAINTENANCE";

          return (
            <div
              key={room.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            >
              {/* Image banner */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold text-white border border-white/20">
                    {room.code}
                  </span>
                  <span className="rounded-lg bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-800">
                    {room.floor}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${
                      isAvailable
                        ? "bg-emerald-500 text-white"
                        : isMaintenance
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isAvailable && <CheckCircle2 className="h-3 w-3" />}
                    {isMaintenance && <AlertTriangle className="h-3 w-3" />}
                    {isAvailable ? "Sẵn sàng" : isMaintenance ? "Bảo trì" : "Đang dùng"}
                  </span>
                </div>

                {/* Bottom title on image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-base font-bold text-white drop-shadow-sm truncate">
                    {room.name}
                  </h4>
                  <p className="text-[11px] font-medium text-white/90">
                    {room.disciplineLabel}
                  </p>
                </div>
              </div>

              {/* Room Specs & Details */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] leading-relaxed">
                  {room.description || "Phòng tập tiêu chuẩn hiện đại của trung tâm."}
                </p>

                {/* Specs row */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Diện Tích
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {room.areaSqM} m²
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sức Chứa
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {room.maxCapacity} người
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Thiết Bị
                    </span>
                    <span className="font-bold text-[#008b74] font-mono">
                      {room.equipmentCount} máy
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(room)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#008b74] transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Chỉnh Sửa (PUT)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
