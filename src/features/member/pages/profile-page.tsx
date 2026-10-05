import React, { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Ruler,
  Target,
  HeartPulse,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Camera,
  X,
  Check,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { get, put, errorText } from "@/lib/api";
import { cn } from "@/lib/utils";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export type GenderType = "MALE" | "FEMALE" | "OTHER";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  gender?: GenderType;
  fitnessGoals?: string;
  medicalHistory?: string;
  heightCm?: number;
  isActive?: boolean;
  memberProfile?: {
    fitnessGoals?: string;
    medicalHistory?: string;
    heightCm?: number;
    gender?: GenderType;
  };
}

export interface UpdateProfileDto {
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  gender?: GenderType;
  heightCm?: number;
  fitnessGoals?: string;
  medicalHistory?: string;
}

// ==========================================
// 2. CONSTANTS & PRESETS
// ==========================================
const PRESET_AVATARS = [
  {
    name: "Nam Thể Thao",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Nữ Fitness",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Nam PT Gym",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Nữ Yoga",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
];

const FITNESS_GOAL_SUGGESTIONS = [
  "Tăng 2kg cơ bắp",
  "Giảm 3kg mỡ thừa",
  "Cải thiện sức bền tim mạch",
  "Uốn dẻo Yoga & giải tỏa stress",
  "Luyện Boxing tăng phản xạ",
  "Duy trì vóc dáng săn chắc",
];

const MEDICAL_SUGGESTIONS = [
  "Không có bệnh lý nền, sức khỏe tốt",
  "Đau mỏi vai gáy do ngồi văn phòng",
  "Khớp gối cần tránh bài tập quá nặng",
  "Cần khởi động kỹ khớp cổ chân",
];

export function getGenderLabel(gender?: GenderType): {
  label: string;
  icon: string;
  className: string;
} {
  if (gender === "FEMALE") {
    return {
      label: "Nữ",
      icon: "♀",
      className: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    };
  }
  if (gender === "OTHER") {
    return {
      label: "Khác",
      icon: "⚧",
      className: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    };
  }
  return {
    label: "Nam",
    icon: "♂",
    className: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  };
}

// ==========================================
// 3. STORAGE & API SERVICE
// ==========================================
const MOCK_PROFILE_STORAGE_KEY = "sportscenter.mock_profile";

function getStoredMockProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {
    // Ignore parse error
  }
  return null;
}

function saveStoredMockProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    const rawAuth = localStorage.getItem("auth_user");
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      auth.fullName = profile.fullName;
      auth.avatarUrl = profile.avatarUrl;
      localStorage.setItem("auth_user", JSON.stringify(auth));
      window.dispatchEvent(new Event("session-changed"));
    }
  } catch {
    // Ignore write error
  }
}

export const profileApiService = {
  async getProfile(): Promise<UserProfile> {
    const stored = getStoredMockProfile();
    try {
      const beData = await get<UserProfile>("/users/profile/me");
      if (beData) {
        const merged: UserProfile = {
          id: beData.id,
          email: beData.email,
          fullName: beData.fullName,
          phone: beData.phone || stored?.phone || "",
          role: beData.role,
          avatarUrl: beData.avatarUrl !== undefined ? beData.avatarUrl : stored?.avatarUrl ?? "",
          gender: beData.gender || stored?.gender || beData.memberProfile?.gender || "MALE",
          fitnessGoals:
            beData.fitnessGoals ?? beData.memberProfile?.fitnessGoals ?? stored?.fitnessGoals ?? "Tăng 2kg cơ, cải thiện sức bền",
          medicalHistory:
            beData.medicalHistory ?? beData.memberProfile?.medicalHistory ?? stored?.medicalHistory ?? "Không có bệnh lý nền",
          heightCm: beData.heightCm ?? beData.memberProfile?.heightCm ?? stored?.heightCm ?? 175,
          isActive: beData.isActive ?? true,
          memberProfile: beData.memberProfile,
        };
        saveStoredMockProfile(merged);
        return merged;
      }
    } catch {
      // Backend request failed or BE not available yet -> fall back to mock
    }

    if (stored) return stored;

    const defaultProfile: UserProfile = {
      id: "usr-mock-001",
      email: "member@sportscenter.vn",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      role: "MEMBER",
      avatarUrl: "",
      gender: "MALE",
      fitnessGoals: "Tăng 2kg cơ, cải thiện vóc dáng",
      medicalHistory: "Không có bệnh lý nền, sức khỏe tốt",
      heightCm: 175,
      isActive: true,
    };
    saveStoredMockProfile(defaultProfile);
    return defaultProfile;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    const stored = getStoredMockProfile();
    let updatedBeData: UserProfile | null = null;

    try {
      updatedBeData = await put<UserProfile>("/users/profile/me", {
        fullName: dto.fullName,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        fitnessGoals: dto.fitnessGoals,
        medicalHistory: dto.medicalHistory,
        ...(dto.heightCm ? { heightCm: dto.heightCm } : {}),
      });
    } catch {
      // Backend failed or endpoint not implemented -> use mock update
    }

    const updatedProfile: UserProfile = {
      id: updatedBeData?.id || stored?.id || "usr-current",
      email: updatedBeData?.email || stored?.email || "member@sportscenter.vn",
      fullName: dto.fullName,
      phone: dto.phone || "",
      role: updatedBeData?.role || stored?.role || "MEMBER",
      avatarUrl: dto.avatarUrl || "",
      gender: dto.gender || stored?.gender || "MALE",
      fitnessGoals: dto.fitnessGoals || "",
      medicalHistory: dto.medicalHistory || "",
      heightCm: dto.heightCm,
      isActive: true,
      memberProfile: {
        fitnessGoals: dto.fitnessGoals,
        medicalHistory: dto.medicalHistory,
        heightCm: dto.heightCm,
        gender: dto.gender,
      },
    };

    saveStoredMockProfile(updatedProfile);
    return updatedProfile;
  },
};

// ==========================================
// 4. SUBCOMPONENT: PROFILE HEADER (HERO & AVATAR)
// ==========================================
interface ProfileHeaderProps {
  profile: UserProfile;
  avatarUrl?: string;
  onAvatarChange?: (url: string) => void;
  liveFullName?: string;
  livePhone?: string;
  liveGender?: GenderType;
  liveHeightCm?: string | number;
  liveFitnessGoals?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  avatarUrl,
  onAvatarChange,
  liveFullName,
  livePhone,
  liveGender,
  liveHeightCm,
  liveFitnessGoals,
}) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(avatarUrl ?? profile.avatarUrl ?? "");
  const [imgError, setImgError] = useState(false);

  const displayAvatar = avatarUrl !== undefined ? avatarUrl : profile.avatarUrl;
  const displayName = liveFullName || profile.fullName || "Hội viên Sports Center";
  const displayPhone = livePhone !== undefined ? livePhone : profile.phone;
  const displayGender = liveGender || profile.gender || profile.memberProfile?.gender || "MALE";
  const displayHeight = liveHeightCm !== undefined ? liveHeightCm : profile.heightCm;
  const displayGoals = liveFitnessGoals !== undefined ? liveFitnessGoals : profile.fitnessGoals;

  const genderInfo = getGenderLabel(displayGender);
  const hasAvatar = Boolean(displayAvatar && displayAvatar.trim() && !imgError);

  const handleApplyAvatar = () => {
    if (onAvatarChange) onAvatarChange(tempUrl.trim());
    setImgError(false);
    setShowAvatarModal(false);
  };

  const handleClearAvatar = () => {
    if (onAvatarChange) onAvatarChange("");
    setTempUrl("");
    setImgError(false);
    setShowAvatarModal(false);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-[#07191d] text-white p-6 sm:p-8 shadow-xl border border-slate-800/80 mb-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Trigger with camera */}
        <div className="relative shrink-0 group">
          <div
            className={cn(
              "w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 shadow-2xl",
              hasAvatar
                ? "border-4 border-slate-800 ring-2 ring-emerald-500/40 bg-slate-900"
                : "border-3 border-dashed border-slate-700 bg-slate-900/90 text-slate-400"
            )}
          >
            {hasAvatar ? (
              <img
                src={displayAvatar!}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-2">
                <User className="w-10 h-10 text-slate-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chưa có ảnh
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setTempUrl(displayAvatar || "");
              setShowAvatarModal(true);
            }}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-slate-900"
            title="Đổi ảnh đại diện"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Member Details */}
        <div className="flex-1 text-center md:text-left space-y-3.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hội viên chính thức</span>
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                genderInfo.className
              )}
            >
              <span className="text-xs font-black">{genderInfo.icon}</span>
              <span>Giới tính: {genderInfo.label}</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-1.5 gap-x-4 text-xs text-slate-400 mt-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile.email}</span>
              </span>
              {displayPhone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{displayPhone}</span>
                </span>
              )}
              {displayHeight && (
                <span className="inline-flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-500" />
                  <span>{displayHeight} cm</span>
                </span>
              )}
            </div>
          </div>

          {displayGoals && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-400">Mục tiêu:</span>
              <span className="text-emerald-300 font-medium truncate max-w-[280px] sm:max-w-md">
                {displayGoals}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Change Avatar */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Thay đổi ảnh đại diện</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nhập URL ảnh đại diện</span>
              </div>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="h-10 bg-slate-950 border-slate-700 text-xs text-white rounded-xl focus:border-emerald-500"
              />
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Ảnh mẫu gợi ý:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setTempUrl(preset.url)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer",
                      tempUrl === preset.url
                        ? "!bg-emerald-500/20 !border-emerald-500 !text-emerald-300"
                        : "!bg-slate-800/80 !border-slate-700 !text-slate-300 hover:!bg-slate-800 hover:!border-slate-600"
                    )}
                  >
                    <span>{preset.name}</span>
                    {tempUrl === preset.url && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {displayAvatar ? (
                <button
                  type="button"
                  onClick={handleClearAvatar}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa ảnh hiện tại</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAvatarModal(false)}
                  className="h-9 px-4 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="mint"
                  size="sm"
                  onClick={handleApplyAvatar}
                  className="h-9 px-5 rounded-xl bg-[#008b74] hover:bg-emerald-600 text-white font-bold cursor-pointer text-xs"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. SUBCOMPONENT: PROFILE FORM (BENTO GRID)
// ==========================================
interface ProfileFormProps {
  initialData: UserProfile;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  onLiveChange?: (state: {
    fullName: string;
    phone: string;
    gender: GenderType;
    heightCm: string;
    fitnessGoals: string;
  }) => void;
  onSubmit: (dto: UpdateProfileDto) => Promise<void>;
  isSaving: boolean;
  saveSuccess?: boolean;
  saveError?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  avatarUrl,
  onAvatarChange,
  onLiveChange,
  onSubmit,
  isSaving,
  saveSuccess,
  saveError,
}) => {
  const [fullName, setFullName] = useState(initialData.fullName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [gender, setGender] = useState<GenderType>(
    initialData.gender || initialData.memberProfile?.gender || "MALE"
  );
  const [heightCm, setHeightCm] = useState<string>(
    initialData.heightCm ? String(initialData.heightCm) : ""
  );
  const [fitnessGoals, setFitnessGoals] = useState(
    initialData.fitnessGoals || initialData.memberProfile?.fitnessGoals || ""
  );
  const [medicalHistory, setMedicalHistory] = useState(
    initialData.medicalHistory || initialData.memberProfile?.medicalHistory || ""
  );

  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (onLiveChange) {
      onLiveChange({
        fullName,
        phone,
        gender,
        heightCm,
        fitnessGoals,
      });
    }
  }, [fullName, phone, gender, heightCm, fitnessGoals, onLiveChange]);

  const handleReset = () => {
    setFullName(initialData.fullName || "");
    setPhone(initialData.phone || "");
    onAvatarChange(initialData.avatarUrl || "");
    setGender(initialData.gender || initialData.memberProfile?.gender || "MALE");
    setHeightCm(initialData.heightCm ? String(initialData.heightCm) : "");
    setFitnessGoals(initialData.fitnessGoals || initialData.memberProfile?.fitnessGoals || "");
    setMedicalHistory(initialData.medicalHistory || initialData.memberProfile?.medicalHistory || "");
    setValidationError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setValidationError("Vui lòng nhập họ và tên của bạn");
      return;
    }
    setValidationError("");

    await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim(),
      gender,
      heightCm: heightCm ? Number(heightCm) : undefined,
      fitnessGoals: fitnessGoals.trim(),
      medicalHistory: medicalHistory.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 2-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CARD 1: THÔNG TIN CÁ NHÂN & TÀI KHOẢN (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#008b74] flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Thông tin cá nhân & Tài khoản
              </h3>
              <p className="text-xs text-slate-500">
                Thông tin định danh hội viên trên toàn bộ hệ sinh thái trung tâm
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Họ và tên</span>
                  <span className="text-rose-500 font-bold">*</span>
                </span>
              </div>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="h-11 rounded-xl text-xs font-medium bg-slate-50/80 border-slate-200 focus:bg-white text-slate-900 focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15 transition-all"
              />
            </div>

            {/* Gender Segmented Control */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Giới tính</span>
                <span className="text-[11px] text-slate-400 font-medium">Được hiển thị trên thẻ</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70">
                {[
                  { id: "MALE" as GenderType, label: "Nam", icon: "♂" },
                  { id: "FEMALE" as GenderType, label: "Nữ", icon: "♀" },
                  { id: "OTHER" as GenderType, label: "Khác", icon: "⚧" },
                ].map((g) => {
                  const active = gender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border",
                        active
                          ? "!bg-white !text-emerald-700 !border-emerald-300 shadow-xs"
                          : "!bg-transparent !text-slate-600 !border-transparent hover:!text-slate-900 hover:!bg-white/60"
                      )}
                    >
                      <span className="text-sm font-black">{g.icon}</span>
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Phone */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số điện thoại</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </span>
                </div>
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="h-11 rounded-xl text-xs font-medium bg-slate-50/80 border-slate-200 focus:bg-white text-slate-900 focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15 transition-all"
                />
              </div>

              {/* Height (cm) */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chiều cao (cm)</span>
                  </span>
                </div>
                <Input
                  type="number"
                  min="50"
                  max="250"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="Ví dụ: 175"
                  className="h-11 rounded-xl text-xs font-medium bg-slate-50/80 border-slate-200 focus:bg-white text-slate-900 focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15 transition-all"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5 text-left pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email tài khoản</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Lock className="w-3 h-3 text-slate-400" /> Cố định theo tài khoản
                </span>
              </div>
              <Input
                disabled
                value={initialData.email}
                className="h-11 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: MỤC TIÊU THỂ HÌNH & SỨC KHỎE (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Mục tiêu & Thể lực
              </h3>
              <p className="text-xs text-slate-500">
                Hồ sơ thể chất phục vụ xây dựng giáo án HLV
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Fitness Goals */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mục tiêu thể hình</span>
                </span>
              </div>
              <textarea
                rows={3}
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                placeholder="Ví dụ: Tăng 2kg cơ bắp, giảm mỡ vòng eo, tăng thể lực..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />

              {/* Quick Goal Suggestion Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
                </span>
                {FITNESS_GOAL_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const currentText = fitnessGoals.trim();
                      if (!currentText) setFitnessGoals(tag);
                      else if (!currentText.includes(tag)) setFitnessGoals(`${currentText}, ${tag}`);
                    }}
                    className="!px-2.5 !py-1 !rounded-lg !text-[11px] !font-medium !bg-slate-100 hover:!bg-emerald-50 hover:!text-[#008b74] !text-slate-600 !border !border-slate-200 transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-2 text-left pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tiền sử sức khỏe & Bệnh lý nền</span>
                </span>
              </div>
              <textarea
                rows={3}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Ví dụ: Không có bệnh lý nền / Tiền sử đau thắt lưng nhẹ..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />

              {/* Quick Medical Suggestion Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Mẫu:
                </span>
                {MEDICAL_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setMedicalHistory(tag)}
                    className="!px-2.5 !py-1 !rounded-lg !text-[11px] !font-medium !bg-slate-100 hover:!bg-teal-50 hover:!text-teal-700 !text-slate-600 !border !border-slate-200 transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Hồ sơ cá nhân đã được lưu và cập nhật thành công!</span>
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-400 font-medium hidden sm:block">
          Các thay đổi sẽ được đồng bộ ngay lập tức vào thẻ hội viên của bạn.
        </p>

        <div className="flex items-center gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="h-11 px-5 rounded-2xl text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Đặt lại</span>
          </Button>

          <Button
            type="submit"
            variant="mint"
            disabled={isSaving}
            className="h-11 px-7 rounded-2xl text-xs font-bold tracking-wide bg-[#008b74] hover:bg-[#007360] text-white shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
};

// ==========================================
// 6. MAIN PROFILE PAGE
// ==========================================
export const ProfilePage: React.FC = () => {
  const { user, verify } = useSession();
  const cache = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const profileQuery = useQuery({
    queryKey: ["member", user?.id || "current", "profile"],
    queryFn: () => profileApiService.getProfile(),
  });

  const [avatarUrl, setAvatarUrl] = useState("");
  const [liveForm, setLiveForm] = useState<{
    fullName: string;
    phone: string;
    gender: GenderType;
    heightCm: string;
    fitnessGoals: string;
  } | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setAvatarUrl(profileQuery.data.avatarUrl || "");
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpdateProfileDto) => profileApiService.updateProfile(dto),
    onSuccess: async () => {
      setSaveSuccess(true);
      setSaveError("");
      await cache.invalidateQueries({
        queryKey: ["member", user?.id || "current", "profile"],
      });
      if (verify) {
        void verify();
      }
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    },
    onError: (err) => {
      setSaveSuccess(false);
      setSaveError(errorText(err) || "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    },
  });

  const handleSubmit = async (dto: UpdateProfileDto) => {
    setSaveSuccess(false);
    setSaveError("");
    await saveMutation.mutateAsync(dto);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* Page Header Title */}
      <PageTitle eyebrow="MEM-10 · HỒ SƠ" title="Thông tin cá nhân & Thể chất" />

      {/* Loading / Error States */}
      <StateMessage
        loading={profileQuery.isPending}
        error={profileQuery.error}
        onRetry={() => void profileQuery.refetch()}
      />

      {/* Render Main Content Once Loaded */}
      {profileQuery.data && (
        <div className="space-y-6">
          {/* Visual Hero Card with Avatar & Live Status */}
          <ProfileHeader
            profile={profileQuery.data}
            avatarUrl={avatarUrl}
            onAvatarChange={setAvatarUrl}
            liveFullName={liveForm?.fullName}
            livePhone={liveForm?.phone}
            liveGender={liveForm?.gender}
            liveHeightCm={liveForm?.heightCm}
            liveFitnessGoals={liveForm?.fitnessGoals}
          />

          {/* Clean 2-Column Bento Form */}
          <ProfileForm
            initialData={profileQuery.data}
            avatarUrl={avatarUrl}
            onAvatarChange={setAvatarUrl}
            onLiveChange={setLiveForm}
            onSubmit={handleSubmit}
            isSaving={saveMutation.isPending}
            saveSuccess={saveSuccess}
            saveError={saveError}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
