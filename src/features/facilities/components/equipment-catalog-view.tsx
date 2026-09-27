import React, { useState, useMemo } from "react";
import {
  Dumbbell,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  DoorOpen,
  Calendar,
  Tag,
  Edit2,
} from "lucide-react";
import {
  FacilityEquipment,
  FacilityRoom,
  EquipmentCategory,
  EquipmentCondition,
} from "../types";

interface EquipmentCatalogViewProps {
  equipment: FacilityEquipment[];
  rooms: FacilityRoom[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (item: FacilityEquipment) => void;
}

export const EquipmentCatalogView: React.FC<EquipmentCatalogViewProps> = ({
  equipment,
  rooms,
  onOpenCreateModal,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");
  const [selectedCondition, setSelectedCondition] = useState<string>("ALL");

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedRoomId !== "ALL" && item.roomId !== selectedRoomId) {
        return false;
      }
      if (selectedCondition !== "ALL" && item.conditionStatus !== selectedCondition) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchRoom = item.roomName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchBrand && !matchRoom) return false;
      }
      return true;
    });
  }, [equipment, selectedCategory, selectedRoomId, selectedCondition, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm máy tập, hãng, phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả nhóm máy</option>
              <option value="CARDIO">Máy Cardio</option>
              <option value="STRENGTH">Máy Khối / Cơ Lực</option>
              <option value="FREE_WEIGHTS">Tạ Tự Do</option>
              <option value="COMBAT">Thiết Bị Võ Thuật</option>
              <option value="ACCESSORY">Dụng Cụ Phụ Trợ</option>
            </select>

            {/* Room Filter */}
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả phòng đặt</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#008b74] focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="OPERATIONAL">Hoạt động tốt</option>
              <option value="NEEDS_SERVICE">Cần bảo dưỡng</option>
              <option value="MAINTENANCE">Đang sửa chữa</option>
            </select>

            {/* Add Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#008b74] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#007461] transition-all ml-auto sm:ml-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Máy (POST)
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-4 pr-2">Mã & Tên Thiết Bị</th>
              <th className="px-3 py-3.5">Nhóm Phân Loại</th>
              <th className="px-3 py-3.5">Phòng Bố Trí</th>
              <th className="px-3 py-3.5">Hãng & Số Lượng</th>
              <th className="px-3 py-3.5">Bảo Dưỡng Kế Tiếp</th>
              <th className="px-3 py-3.5">Tình Trạng</th>
              <th className="py-3.5 pl-2 pr-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map((item) => {
                const isOperational = item.conditionStatus === "OPERATIONAL";
                const isNeedsService = item.conditionStatus === "NEEDS_SERVICE";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code & Name */}
                    <td className="py-3 pl-4 pr-2">
                      <div className="font-mono text-[10px] font-bold text-[#008b74]">
                        {item.code}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5 text-xs">
                        {item.name}
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {item.categoryLabel}
                      </span>
                    </td>

                    {/* Room */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <DoorOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{item.roomName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {item.roomCode}
                      </span>
                    </td>

                    {/* Brand & Quantity */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{item.brand}</div>
                      <div className="text-[10px] text-slate-500">
                        Số lượng: <strong className="font-mono text-[#008b74]">{item.quantity}</strong> máy
                      </div>
                    </td>

                    {/* Next Maintenance */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{item.nextMaintenanceDate}</span>
                      </div>
                    </td>

                    {/* Condition Status */}
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isOperational
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isNeedsService
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isOperational && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
                        {isNeedsService && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                        {!isOperational && !isNeedsService && (
                          <Wrench className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span>
                          {isOperational
                            ? "Hoạt động tốt"
                            : isNeedsService
                            ? "Cần bảo dưỡng"
                            : "Bảo trì / Ngưng"}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#008b74] hover:text-[#008b74] transition-all shadow-xs"
                      >
                        <Edit2 className="h-3 w-3 shrink-0" />
                        Sửa (PUT)
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Không tìm thấy thiết bị nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
