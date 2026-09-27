import React from "react";
import {
  DoorOpen,
  Dumbbell,
  Lock,
  Wrench,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { FacilityRoom, FacilityEquipment, LockerItem } from "../types";

interface FacilityStatsSummaryProps {
  rooms: FacilityRoom[];
  equipment: FacilityEquipment[];
  lockers: LockerItem[];
}

export const FacilityStatsSummary: React.FC<FacilityStatsSummaryProps> = ({
  rooms,
  equipment,
  lockers,
}) => {
  const activeRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const totalRooms = rooms.length;

  const totalEquipmentUnits = equipment.reduce((acc, eq) => acc + eq.quantity, 0);
  const operationalUnits = equipment
    .filter((eq) => eq.conditionStatus === "OPERATIONAL")
    .reduce((acc, eq) => acc + eq.quantity, 0);
  const equipmentHealthRate =
    totalEquipmentUnits > 0
      ? Math.round((operationalUnits / totalEquipmentUnits) * 100)
      : 100;

  const totalLockers = lockers.length;
  const occupiedLockers = lockers.filter((l) => l.status === "OCCUPIED").length;
  const maintenanceLockers = lockers.filter((l) => l.status === "MAINTENANCE").length;
  const lockerOccupancyRate =
    totalLockers > 0 ? Math.round((occupiedLockers / totalLockers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Rooms Available */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
          <DoorOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Phòng Tập Khả Dụng
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {activeRooms}/{totalRooms}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              Phòng sẵn sàng
            </span>
          </div>
        </div>
      </div>

      {/* 2. Total Equipment Units */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Dumbbell className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Máy Tập & Thiết Bị
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {totalEquipmentUnits}
            </span>
            <span className="text-xs font-medium text-blue-600">
              {equipmentHealthRate}% Tốt
            </span>
          </div>
        </div>
      </div>

      {/* 3. Locker Occupancy Rate */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tủ Đồ Đang Sử Dụng
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {occupiedLockers}/{totalLockers}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({lockerOccupancyRate}% Lấp đầy)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Lockers In Maintenance */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tủ Đang Bảo Trì
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {maintenanceLockers}
            </span>
            <span className="text-xs font-medium text-amber-700">
              Cần kiểm tra khóa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
