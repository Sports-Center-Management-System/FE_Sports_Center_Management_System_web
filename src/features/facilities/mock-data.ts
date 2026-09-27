import {
  FacilityRoom,
  FacilityEquipment,
  LockerItem,
  LockerZoneStats,
} from "./types";

export const MOCK_ROOMS: FacilityRoom[] = [
  {
    id: "room-gym-01",
    code: "ROOM-GYM-01",
    name: "Khu Thể Hình Đa Năng Gym",
    discipline: "GYM",
    disciplineLabel: "Gym & Thể hình",
    floor: "Tầng 1",
    areaSqM: 350,
    maxCapacity: 60,
    status: "AVAILABLE",
    equipmentCount: 28,
    description: "Khu vực tập luyện tạ tự do, máy khối Selectorized và chuỗi máy Cardio LifeFitness.",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "room-yog-01",
    code: "ROOM-YOG-01",
    name: "Studio Yoga Thiền Định & Trị Liệu",
    discipline: "YOGA",
    disciplineLabel: "Yoga",
    floor: "Tầng 2",
    areaSqM: 120,
    maxCapacity: 25,
    status: "AVAILABLE",
    equipmentCount: 8,
    description: "Không gian thanh tịnh với sàn gỗ sồi tự nhiên, thảm Manduka và hệ thống chiếu sáng dịu nhẹ.",
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "room-box-01",
    code: "ROOM-BOX-01",
    name: "Sàn Đấu Boxing & Đệm Võ",
    discipline: "BOXING",
    disciplineLabel: "Boxing & Kickfit",
    floor: "Tầng 1",
    areaSqM: 160,
    maxCapacity: 20,
    status: "AVAILABLE",
    equipmentCount: 14,
    description: "Vũ đài chuẩn thi đấu đối kháng, giàn 8 bao cát Fairtex nặng và sàn bạt giảm chấn chấn thương.",
    imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "room-dan-01",
    code: "ROOM-DAN-01",
    name: "Phòng Gương Vũ Đạo Dance",
    discipline: "DANCING",
    disciplineLabel: "Dancing & Zumba",
    floor: "Tầng 2",
    areaSqM: 140,
    maxCapacity: 30,
    status: "AVAILABLE",
    equipmentCount: 6,
    description: "Gương toàn phần 3 mặt tường, dàn âm thanh vòm JBL sân khấu và sàn nhún vũ đạo tiêu chuẩn.",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "room-multi-02",
    code: "ROOM-MULTI-02",
    name: "Phòng Đa Năng Studio B",
    discipline: "MULTI",
    disciplineLabel: "Đa Năng",
    floor: "Tầng 3",
    areaSqM: 110,
    maxCapacity: 18,
    status: "MAINTENANCE",
    equipmentCount: 5,
    description: "Phòng tập phục vụ lớp nhóm nhỏ TRX và giãn cơ. Đang bảo dưỡng hệ thống điều hòa trung tâm.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
  },
];

export const MOCK_EQUIPMENT: FacilityEquipment[] = [
  {
    id: "eq-01",
    code: "EQ-TRD-01",
    name: "Máy Chạy Bộ LifeFitness Platinum Club",
    category: "CARDIO",
    categoryLabel: "Máy Cardio",
    roomId: "room-gym-01",
    roomCode: "ROOM-GYM-01",
    roomName: "Khu Thể Hình Đa Năng Gym",
    brand: "LifeFitness (USA)",
    purchaseDate: "2025-01-15",
    warrantyExpiry: "2028-01-15",
    lastMaintenanceDate: "2026-08-10",
    nextMaintenanceDate: "2026-11-10",
    conditionStatus: "OPERATIONAL",
    quantity: 6,
    notes: "Động cơ 4.0 HP, đệm giảm chấn FlexDeck, màn hình cảm ứng 16-inch.",
  },
  {
    id: "eq-02",
    code: "EQ-CYC-02",
    name: "Xe Đạp Trượt Kháng Lực Matrix Pro",
    category: "CARDIO",
    categoryLabel: "Máy Cardio",
    roomId: "room-gym-01",
    roomCode: "ROOM-GYM-01",
    roomName: "Khu Thể Hình Đa Năng Gym",
    brand: "Matrix Fitness",
    purchaseDate: "2025-02-20",
    warrantyExpiry: "2027-02-20",
    lastMaintenanceDate: "2026-07-15",
    nextMaintenanceDate: "2026-10-15",
    conditionStatus: "OPERATIONAL",
    quantity: 4,
    notes: "Kháng lực từ tính 25 cấp độ, hỗ trợ đo nhịp tim không dây.",
  },
  {
    id: "eq-03",
    code: "EQ-SMT-03",
    name: "Giàn Gánh Tạ Khung Smith Machine 3D",
    category: "STRENGTH",
    categoryLabel: "Máy Khối / Cơ Lực",
    roomId: "room-gym-01",
    roomCode: "ROOM-GYM-01",
    roomName: "Khu Thể Hình Đa Năng Gym",
    brand: "Hammer Strength",
    purchaseDate: "2024-11-05",
    warrantyExpiry: "2029-11-05",
    lastMaintenanceDate: "2026-09-01",
    nextMaintenanceDate: "2026-12-01",
    conditionStatus: "OPERATIONAL",
    quantity: 2,
    notes: "Thanh đòn cân bằng đối trọng 7 độ nghiêng tự nhiên, chốt khóa an toàn đa điểm.",
  },
  {
    id: "eq-04",
    code: "EQ-LAT-04",
    name: "Máy Kéo Xô Đôi Lat Pulldown & Low Row",
    category: "STRENGTH",
    categoryLabel: "Máy Khối / Cơ Lực",
    roomId: "room-gym-01",
    roomCode: "ROOM-GYM-01",
    roomName: "Khu Thể Hình Đa Năng Gym",
    brand: "Technogym Pure",
    purchaseDate: "2025-03-10",
    warrantyExpiry: "2028-03-10",
    lastMaintenanceDate: "2026-08-25",
    nextMaintenanceDate: "2026-11-25",
    conditionStatus: "NEEDS_SERVICE",
    quantity: 2,
    notes: "Dây cáp bọc nilon có dấu hiệu mòn nhẹ, cần bôi trơn ròng rọc và cân chỉnh tạ khối.",
  },
  {
    id: "eq-05",
    code: "EQ-DMB-05",
    name: "Bộ Tạ Tay Urethane Dumbbell Set (2.5kg - 50kg)",
    category: "FREE_WEIGHTS",
    categoryLabel: "Tạ Tự Do",
    roomId: "room-gym-01",
    roomCode: "ROOM-GYM-01",
    roomName: "Khu Thể Hình Đa Năng Gym",
    brand: "ZIVA Signature",
    purchaseDate: "2024-12-01",
    warrantyExpiry: "2027-12-01",
    lastMaintenanceDate: "2026-09-12",
    nextMaintenanceDate: "2026-12-12",
    conditionStatus: "OPERATIONAL",
    quantity: 20,
    notes: "Đầu tạ bọc Urethane chống va đập sàn, tay cầm mạ chrome khía vân kim cương.",
  },
  {
    id: "eq-06",
    code: "EQ-PCH-06",
    name: "Bao Cát Treo Da Thật Fairtex Heavy Bag (60kg)",
    category: "COMBAT",
    categoryLabel: "Thiết Bị Võ Thuật",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing & Đệm Võ",
    brand: "Fairtex Thailand",
    purchaseDate: "2025-04-18",
    warrantyExpiry: "2027-04-18",
    lastMaintenanceDate: "2026-08-15",
    nextMaintenanceDate: "2026-11-15",
    conditionStatus: "OPERATIONAL",
    quantity: 6,
    notes: "Ruột mút ép đa tầng, xích treo thép đúc xoay 360 độ chống xoắn dây.",
  },
  {
    id: "eq-07",
    code: "EQ-RNG-07",
    name: "Vũ Đài Boxing Tiêu Chuẩn 6m x 6m",
    category: "COMBAT",
    categoryLabel: "Thiết Bị Võ Thuật",
    roomId: "room-box-01",
    roomCode: "ROOM-BOX-01",
    roomName: "Sàn Đấu Boxing & Đệm Võ",
    brand: "Everlast Pro Fight",
    purchaseDate: "2024-10-10",
    warrantyExpiry: "2029-10-10",
    lastMaintenanceDate: "2026-09-05",
    nextMaintenanceDate: "2026-12-05",
    conditionStatus: "OPERATIONAL",
    quantity: 1,
    notes: "Khung thép hộp chịu lực, đệm EVA 4cm chống sốc và 4 dây đài bọc da bò êm ái.",
  },
  {
    id: "eq-08",
    code: "EQ-YOG-08",
    name: "Bộ Khung Gỗ Yoga Bay & Dây Lụa Aerial",
    category: "ACCESSORY",
    categoryLabel: "Dụng Cụ Phụ Trợ",
    roomId: "room-yog-01",
    roomCode: "ROOM-YOG-01",
    roomName: "Studio Yoga Thiền Định & Trị Liệu",
    brand: "Aerial Yoga Gear",
    purchaseDate: "2025-05-12",
    warrantyExpiry: "2027-05-12",
    lastMaintenanceDate: "2026-09-18",
    nextMaintenanceDate: "2026-10-18",
    conditionStatus: "OPERATIONAL",
    quantity: 15,
    notes: "Móc khóa leo núi Caribiner chịu tải 1500kg, lụa nylon Tricot đàn hồi mềm mịn.",
  },
  {
    id: "eq-09",
    code: "EQ-TRX-09",
    name: "Dây Kháng Lực Treo Kháng Thân TRX Commercial",
    category: "ACCESSORY",
    categoryLabel: "Dụng Cụ Phụ Trợ",
    roomId: "room-multi-02",
    roomCode: "ROOM-MULTI-02",
    roomName: "Phòng Đa Năng Studio B",
    brand: "TRX Training",
    purchaseDate: "2025-06-01",
    warrantyExpiry: "2027-06-01",
    lastMaintenanceDate: "2026-07-20",
    nextMaintenanceDate: "2026-09-20",
    conditionStatus: "MAINTENANCE",
    quantity: 10,
    notes: "Đang kiểm định lại điểm neo trần bê tông sau khi bảo dưỡng điều hòa.",
  },
];

// Helper to generate full lockers set
const generateFullLockers = (): LockerItem[] => {
  const lockers: LockerItem[] = [];

  // 1. Male Lockers: M-01 to M-36 (Tầng 1)
  const maleMembers = [
    { name: "Nguyễn Văn Tuấn", phone: "0912 345 678", time: "16:45" },
    { name: "Trần Minh Quang", phone: "0988 123 456", time: "17:10" },
    { name: "Phạm Hải Đăng", phone: "0903 889 911", time: "17:25" },
    { name: "Lê Hoàng Phúc", phone: "0934 556 778", time: "17:30" },
    { name: "Võ Quốc Cường", phone: "0977 223 344", time: "17:40" },
    { name: "Đỗ Anh Dũng", phone: "0918 667 788", time: "17:50" },
    { name: "Bùi Trọng Nghĩa", phone: "0944 332 211", time: "18:00" },
    { name: "Dương Minh Trí", phone: "0909 554 433", time: "18:15" },
    { name: "Vũ Gia Huy", phone: "0966 778 899", time: "18:20" },
    { name: "Hồ Hoàng Long", phone: "0938 112 233", time: "18:30" },
    { name: "Ngô Quốc Bảo", phone: "0982 445 566", time: "18:40" },
    { name: "Trịnh Khắc Toàn", phone: "0915 889 900", time: "18:45" },
  ];

  for (let i = 1; i <= 36; i++) {
    const code = `M-${String(i).padStart(2, "0")}`;
    let status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" = "AVAILABLE";
    let memberName: string | undefined = undefined;
    let memberPhone: string | undefined = undefined;
    let checkInTime: string | undefined = undefined;
    let reason: string | undefined = undefined;

    if (i === 15) {
      status = "MAINTENANCE";
      reason = "Kẹt khóa điện tử cảm ứng - Đang chờ linh kiện thay thế";
    } else if (i === 28) {
      status = "MAINTENANCE";
      reason = "Bản lề cánh tủ bị lỏng ốc vít";
    } else if (i <= maleMembers.length) {
      status = "OCCUPIED";
      const m = maleMembers[i - 1];
      memberName = m.name;
      memberPhone = m.phone;
      checkInTime = m.time;
    }

    lockers.push({
      id: `lck-m-${i}`,
      code,
      zone: "MALE",
      zoneLabel: "Khu vực Nam (Tầng 1)",
      status,
      currentMemberName: memberName,
      currentMemberPhone: memberPhone,
      checkInTime,
      maintenanceReason: reason,
      lastUpdated: "2026-09-27 18:30",
    });
  }

  // 2. Female Lockers: F-01 to F-36 (Tầng 1)
  const femaleMembers = [
    { name: "Nguyễn Thảo Ly", phone: "0905 112 233", time: "16:30" },
    { name: "Lê Kiều Oanh", phone: "0932 445 566", time: "17:00" },
    { name: "Phan Ánh Nguyệt", phone: "0987 665 544", time: "17:15" },
    { name: "Trần Bảo Ngọc", phone: "0914 223 355", time: "17:20" },
    { name: "Đặng Mỹ Linh", phone: "0968 776 655", time: "17:35" },
    { name: "Võ Thúy Vy", phone: "0942 998 877", time: "17:45" },
    { name: "Hoàng Yến Nhi", phone: "0908 334 455", time: "18:05" },
    { name: "Chu Thanh Thảo", phone: "0935 221 144", time: "18:10" },
    { name: "Đỗ Kim Ngân", phone: "0973 887 766", time: "18:25" },
    { name: "Nguyễn Hương Giang", phone: "0916 443 322", time: "18:35" },
  ];

  for (let i = 1; i <= 36; i++) {
    const code = `F-${String(i).padStart(2, "0")}`;
    let status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" = "AVAILABLE";
    let memberName: string | undefined = undefined;
    let memberPhone: string | undefined = undefined;
    let checkInTime: string | undefined = undefined;
    let reason: string | undefined = undefined;

    if (i === 12) {
      status = "MAINTENANCE";
      reason = "Pin khóa số báo yếu, cần thay pin CR123A";
    } else if (i <= femaleMembers.length) {
      status = "OCCUPIED";
      const m = femaleMembers[i - 1];
      memberName = m.name;
      memberPhone = m.phone;
      checkInTime = m.time;
    }

    lockers.push({
      id: `lck-f-${i}`,
      code,
      zone: "FEMALE",
      zoneLabel: "Khu vực Nữ (Tầng 1)",
      status,
      currentMemberName: memberName,
      currentMemberPhone: memberPhone,
      checkInTime,
      maintenanceReason: reason,
      lastUpdated: "2026-09-27 18:35",
    });
  }

  // 3. VIP Lockers: VIP-01 to VIP-20 (Tầng 2)
  const vipMembers = [
    { name: "Đoàn Minh Trí (VIP Diamond)", phone: "0903 999 888", time: "16:00" },
    { name: "Phạm Thu Hương (VIP Platinum)", phone: "0918 888 777", time: "16:50" },
    { name: "Lý Gia Hân (VIP Gold)", phone: "0989 777 666", time: "17:15" },
    { name: "Trịnh Vĩnh Khang (VIP Diamond)", phone: "0908 666 555", time: "17:45" },
    { name: "Nguyễn Hải Yến (VIP Platinum)", phone: "0933 555 444", time: "18:00" },
    { name: "Vũ Mạnh Hùng (VIP Diamond)", phone: "0912 444 333", time: "18:20" },
  ];

  for (let i = 1; i <= 20; i++) {
    const code = `VIP-${String(i).padStart(2, "0")}`;
    let status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" = "AVAILABLE";
    let memberName: string | undefined = undefined;
    let memberPhone: string | undefined = undefined;
    let checkInTime: string | undefined = undefined;
    let reason: string | undefined = undefined;

    if (i === 18) {
      status = "MAINTENANCE";
      reason = "Cảm biến thẻ RFID VIP không nhận diện tín hiệu";
    } else if (i <= vipMembers.length) {
      status = "OCCUPIED";
      const m = vipMembers[i - 1];
      memberName = m.name;
      memberPhone = m.phone;
      checkInTime = m.time;
    }

    lockers.push({
      id: `lck-vip-${i}`,
      code,
      zone: "VIP",
      zoneLabel: "Khu vực VIP (Tầng 2)",
      status,
      currentMemberName: memberName,
      currentMemberPhone: memberPhone,
      checkInTime,
      maintenanceReason: reason,
      lastUpdated: "2026-09-27 18:40",
    });
  }

  return lockers;
};

export const INITIAL_LOCKERS: LockerItem[] = generateFullLockers();

export const calculateLockerStats = (lockers: LockerItem[]): LockerZoneStats[] => {
  const zones: ("MALE" | "FEMALE" | "VIP")[] = ["MALE", "FEMALE", "VIP"];
  const labels: Record<string, string> = {
    MALE: "Khu vực Nam",
    FEMALE: "Khu vực Nữ",
    VIP: "Khu vực VIP",
  };

  return zones.map((zone) => {
    const zoneLockers = lockers.filter((l) => l.zone === zone);
    const total = zoneLockers.length;
    const occupied = zoneLockers.filter((l) => l.status === "OCCUPIED").length;
    const available = zoneLockers.filter((l) => l.status === "AVAILABLE").length;
    const maintenance = zoneLockers.filter((l) => l.status === "MAINTENANCE").length;
    const utilizationRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      zone,
      zoneLabel: labels[zone],
      total,
      occupied,
      available,
      maintenance,
      utilizationRate,
    };
  });
};
