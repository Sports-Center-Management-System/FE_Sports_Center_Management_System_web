import React, { useState } from "react";
import {
  Building2,
  Lock,
  DoorOpen,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  FacilityRoom,
  FacilityEquipment,
  LockerItem,
  UpdateLockerStatusPayload,
  CreateRoomPayload,
  UpdateRoomPayload,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
} from "../types";
import {
  MOCK_ROOMS,
  MOCK_EQUIPMENT,
  INITIAL_LOCKERS,
} from "../mock-data";
import { FacilityStatsSummary } from "../components/facility-stats-summary";
import { LockersGridView } from "../components/lockers-grid-view";
import { LockerStatusModal } from "../components/locker-status-modal";
import { RoomsCatalogView } from "../components/rooms-catalog-view";
import { RoomFormModal } from "../components/room-form-modal";
import { EquipmentCatalogView } from "../components/equipment-catalog-view";
import { EquipmentFormModal } from "../components/equipment-form-modal";

type ActiveTab = "LOCKERS" | "ROOMS" | "EQUIPMENT";

export const FacilitiesManagementPage: React.FC = () => {
  // Master state
  const [activeTab, setActiveTab] = useState<ActiveTab>("LOCKERS");
  const [rooms, setRooms] = useState<FacilityRoom[]>(MOCK_ROOMS);
  const [equipment, setEquipment] = useState<FacilityEquipment[]>(MOCK_EQUIPMENT);
  const [lockers, setLockers] = useState<LockerItem[]>(INITIAL_LOCKERS);

  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modals state
  const [selectedLockerForEdit, setSelectedLockerForEdit] = useState<LockerItem | null>(null);
  const [isLockerModalOpen, setIsLockerModalOpen] = useState(false);

  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<FacilityRoom | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] =
    useState<FacilityEquipment | null>(null);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  // Auto clear toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle PUT Locker Status
  const handleUpdateLockerStatus = (payload: UpdateLockerStatusPayload) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id === payload.lockerId) {
          const nowStr = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            ...l,
            status: payload.status,
            currentMemberName: payload.currentMemberName,
            currentMemberPhone: payload.currentMemberPhone,
            checkInTime: payload.status === "OCCUPIED" ? (l.checkInTime || nowStr) : undefined,
            maintenanceReason: payload.maintenanceReason,
            lastUpdated: `2026-09-27 ${nowStr}`,
          };
        }
        return l;
      })
    );

    const statusLabel =
      payload.status === "AVAILABLE"
        ? "Sẵn sàng (Đã giải phóng)"
        : payload.status === "OCCUPIED"
        ? `Đang dùng (${payload.currentMemberName})`
        : `Bảo trì (${payload.maintenanceReason})`;

    setToastMessage({
      type: "success",
      text: `Cập nhật trạng thái tủ thành công (PUT): ${statusLabel}`,
    });
  };

  // Handle Open Locker Modal
  const handleOpenLockerModal = (locker: LockerItem) => {
    setSelectedLockerForEdit(locker);
    setIsLockerModalOpen(true);
  };

  // Handle POST / PUT Room
  const handleSaveRoom = (payload: CreateRoomPayload | UpdateRoomPayload) => {
    if ("id" in payload) {
      // PUT
      setRooms((prev) =>
        prev.map((r) =>
          r.id === payload.id
            ? {
                ...r,
                ...payload,
                disciplineLabel:
                  payload.discipline === "GYM"
                    ? "Gym & Thể hình"
                    : payload.discipline === "YOGA"
                    ? "Yoga"
                    : payload.discipline === "BOXING"
                    ? "Boxing & Kickfit"
                    : payload.discipline === "DANCING"
                    ? "Dancing & Zumba"
                    : "Đa Năng",
              }
            : r
        )
      );
      setToastMessage({
        type: "success",
        text: `Cập nhật thông tin phòng "${payload.name}" thành công (PUT)!`,
      });
    } else {
      // POST
      const newRoom: FacilityRoom = {
        id: `room-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        discipline: payload.discipline,
        disciplineLabel:
          payload.discipline === "GYM"
            ? "Gym & Thể hình"
            : payload.discipline === "YOGA"
            ? "Yoga"
            : payload.discipline === "BOXING"
            ? "Boxing & Kickfit"
            : payload.discipline === "DANCING"
            ? "Dancing & Zumba"
            : "Đa Năng",
        floor: payload.floor,
        areaSqM: payload.areaSqM,
        maxCapacity: payload.maxCapacity,
        status: payload.status,
        equipmentCount: 0,
        description: payload.description,
        imageUrl:
          "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80",
      };
      setRooms((prev) => [newRoom, ...prev]);
      setToastMessage({
        type: "success",
        text: `Tạo phòng tập mới "${newRoom.name}" (${newRoom.code}) thành công (POST)!`,
      });
    }
  };

  // Handle POST / PUT Equipment
  const handleSaveEquipment = (payload: CreateEquipmentPayload | UpdateEquipmentPayload) => {
    const targetRoom = rooms.find((r) => r.id === payload.roomId);
    const roomCode = targetRoom?.code || "ROOM-01";
    const roomName = targetRoom?.name || "Phòng tập";

    const categoryLabel =
      payload.category === "CARDIO"
        ? "Máy Cardio"
        : payload.category === "STRENGTH"
        ? "Máy Khối / Cơ Lực"
        : payload.category === "FREE_WEIGHTS"
        ? "Tạ Tự Do"
        : payload.category === "COMBAT"
        ? "Thiết Bị Võ Thuật"
        : "Dụng Cụ Phụ Trợ";

    if ("id" in payload) {
      // PUT
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.id === payload.id
            ? {
                ...eq,
                ...payload,
                roomCode,
                roomName,
                categoryLabel,
              }
            : eq
        )
      );
      setToastMessage({
        type: "success",
        text: `Cập nhật thiết bị "${payload.name}" thành công (PUT)!`,
      });
    } else {
      // POST
      const newEq: FacilityEquipment = {
        id: `eq-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        category: payload.category,
        categoryLabel,
        roomId: payload.roomId,
        roomCode,
        roomName,
        brand: payload.brand,
        purchaseDate: payload.purchaseDate,
        warrantyExpiry: payload.warrantyExpiry,
        lastMaintenanceDate: payload.lastMaintenanceDate,
        nextMaintenanceDate: payload.nextMaintenanceDate,
        conditionStatus: payload.conditionStatus,
        quantity: payload.quantity,
        notes: payload.notes,
      };
      setEquipment((prev) => [newEq, ...prev]);
      setToastMessage({
        type: "success",
        text: `Thêm máy tập / thiết bị mới "${newEq.name}" thành công (POST)!`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008b74] text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                Quản Lý Cơ Sở Vật Chất & Tủ Đồ
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Theo dõi tình trạng phòng tập, máy móc thiết bị và sơ đồ tủ đồ thông minh 3 phân khu (Nam, Nữ, VIP).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level Facility Stats */}
      <FacilityStatsSummary
        rooms={rooms}
        equipment={equipment}
        lockers={lockers}
      />

      {/* Navigation Tabs (Lockers, Rooms, Equipment) */}
      <div className="flex items-center border-b border-slate-200 bg-white px-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => setActiveTab("LOCKERS")}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition-all ${
            activeTab === "LOCKERS"
              ? "border-[#008b74] text-[#008b74]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Sơ Đồ Quản Lý Tủ Đồ (92 Tủ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ROOMS")}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition-all ${
            activeTab === "ROOMS"
              ? "border-[#008b74] text-[#008b74]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <DoorOpen className="h-4 w-4" />
          <span>Danh Mục Phòng Tập ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EQUIPMENT")}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition-all ${
            activeTab === "EQUIPMENT"
              ? "border-[#008b74] text-[#008b74]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Danh Mục Máy Tập & Thiết Bị ({equipment.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "LOCKERS" && (
          <LockersGridView
            lockers={lockers}
            onSelectLockerToEdit={handleOpenLockerModal}
          />
        )}

        {activeTab === "ROOMS" && (
          <RoomsCatalogView
            rooms={rooms}
            onOpenCreateModal={() => {
              setSelectedRoomForEdit(null);
              setIsRoomModalOpen(true);
            }}
            onOpenEditModal={(room) => {
              setSelectedRoomForEdit(room);
              setIsRoomModalOpen(true);
            }}
          />
        )}

        {activeTab === "EQUIPMENT" && (
          <EquipmentCatalogView
            equipment={equipment}
            rooms={rooms}
            onOpenCreateModal={() => {
              setSelectedEquipmentForEdit(null);
              setIsEquipmentModalOpen(true);
            }}
            onOpenEditModal={(item) => {
              setSelectedEquipmentForEdit(item);
              setIsEquipmentModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <LockerStatusModal
        isOpen={isLockerModalOpen}
        onClose={() => {
          setIsLockerModalOpen(false);
          setSelectedLockerForEdit(null);
        }}
        onSubmit={handleUpdateLockerStatus}
        locker={selectedLockerForEdit}
      />

      <RoomFormModal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setSelectedRoomForEdit(null);
        }}
        onSubmit={handleSaveRoom}
        editingRoom={selectedRoomForEdit}
      />

      <EquipmentFormModal
        isOpen={isEquipmentModalOpen}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setSelectedEquipmentForEdit(null);
        }}
        onSubmit={handleSaveEquipment}
        editingEquipment={selectedEquipmentForEdit}
        rooms={rooms}
      />
    </div>
  );
};
