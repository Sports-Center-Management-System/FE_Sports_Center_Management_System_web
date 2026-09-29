import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Ruler,
  Weight,
  Activity,
  Heart,
  Target,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  UserProfileResponse,
  UpdateProfilePayload,
  InbodyLogItem,
} from "../types/profile.types";
import {
  getMyProfileApi,
  updateMyProfileApi,
  getMyInbodyProgressApi,
} from "../services/profile-api.service";

export const MemberProfileForm: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [inbodyLogs, setInbodyLogs] = useState<InbodyLogItem[]>([]);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [fitnessGoals, setFitnessGoals] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  // Feedback alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial profile data & inbody history
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [profileData, inbodyData] = await Promise.all([
        getMyProfileApi(),
        getMyInbodyProgressApi().catch(() => ({ logs: [] })),
      ]);

      setProfile(profileData);
      setInbodyLogs(inbodyData.logs || []);

      // Populate form
      setFullName(profileData.fullName || "");
      setPhone(profileData.phone || "");
      setAvatarUrl(profileData.avatarUrl || "");
      setHeightCm(
        profileData.memberProfile?.heightCm
          ? String(profileData.memberProfile.heightCm)
          : ""
      );
      setFitnessGoals(profileData.memberProfile?.fitnessGoals || "");
      setMedicalHistory(profileData.memberProfile?.medicalHistory || "");
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          "Không thể tải thông tin hồ sơ. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Họ và tên không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload: UpdateProfilePayload = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        fitnessGoals: fitnessGoals.trim() || undefined,
        medicalHistory: medicalHistory.trim() || undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      };

      const updated = await updateMyProfileApi(payload);
      setProfile(updated);
      setSuccessMessage("Hồ sơ hội viên đã được cập nhật thành công.");

      // Clear success alert after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      const beMsg = err?.response?.data?.message || err?.message;
      if (Array.isArray(beMsg)) {
        setErrorMessage(beMsg.join(", "));
      } else if (typeof beMsg === "string") {
        setErrorMessage(beMsg);
      } else {
        setErrorMessage("Cập nhật hồ sơ thất bại. Vui lòng kiểm tra lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-[#008b74]" />
          <p className="text-xs font-semibold text-slate-500">
            Đang tải dữ liệu hồ sơ hội viên...
          </p>
        </div>
      </div>
    );
  }

  const member = profile?.memberProfile;
  const latestInbody = inbodyLogs.length > 0 ? inbodyLogs[inbodyLogs.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-800 shadow-sm animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-sm animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Main Grid: Left Overview Card & Right Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Profile Card & Body Metrics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Member Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col items-center text-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-500 shadow-md mb-3"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#008b74] text-white text-2xl font-black shadow-md shadow-[#008b74]/30 mb-3">
                  {(fullName || "HV")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {fullName || "Hội viên"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{profile?.email}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#e6f7f2] text-[#008b74]">
                <span>Hội Viên Chính Thức</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mã định danh:</span>
                <span className="font-mono text-[11px] font-medium text-slate-700">
                  {profile?.id ? profile.id.slice(0, 8) + "..." : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-medium text-slate-800">
                  {phone || "Chưa thiết lập"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ngày tham gia:</span>
                <span className="font-medium text-slate-800">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                    : "---"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Chỉ số thể chất hiện tại
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Ruler className="h-3.5 w-3.5 text-[#008b74]" />
                  <span>Chiều cao</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {heightCm ? `${heightCm} cm` : "Chưa có"}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Weight className="h-3.5 w-3.5 text-sky-600" />
                  <span>Cân nặng</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {member?.weightKg
                    ? `${member.weightKg} kg`
                    : latestInbody?.weightKg
                    ? `${latestInbody.weightKg} kg`
                    : "Chưa có"}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Activity className="h-3.5 w-3.5 text-amber-600" />
                  <span>Chỉ số BMI</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {member?.bmi || latestInbody?.bmi || "Chưa có"}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  <span>Tỷ lệ mỡ</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {member?.bodyFatPct
                    ? `${member.bodyFatPct}%`
                    : latestInbody?.bodyFatPct
                    ? `${latestInbody.bodyFatPct}%`
                    : "Chưa có"}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Cân nặng, BMI và tỷ lệ mỡ được đồng bộ tự động từ kết quả đo InBody tại trung tâm.
            </p>
          </div>
        </div>

        {/* Right Column: Update Profile Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Thông tin cá nhân */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#008b74] flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    1. Thông tin cá nhân cơ bản
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cập nhật họ tên, số điện thoại liên lạc và ảnh đại diện
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                    />
                  </div>
                </div>

                {/* Email (Read only) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Địa chỉ Email (Cố định)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={profile?.email || ""}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                    />
                  </div>
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Đường dẫn ảnh đại diện (Avatar URL)
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin thể chất & Sức khỏe */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Chỉ số thể chất & Tiền sử sức khỏe
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ huấn luyện viên và hệ thống theo dõi mức độ đáp ứng bài tập
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height Cm */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Chiều cao (cm)
                  </label>
                  <div className="relative">
                    <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      max="250"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Ví dụ: 175"
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                    />
                  </div>
                </div>

                {/* Medical History */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                    Tiền sử y tế / Bệnh lý mạn tính / Chấn thương
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="Mô tả nếu bạn có tiền sử tim mạch, huyết áp, thoái hóa khớp, chấn thương cũ cần lưu ý..."
                      className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Mục tiêu & Nhu cầu tập luyện */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    3. Mục tiêu & Nhu cầu tập luyện cá nhân
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Xác định trọng tâm thể chất bạn mong muốn đạt được cùng trung tâm
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1.5">
                  Mục tiêu cụ thể
                </label>
                <textarea
                  rows={3}
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  placeholder="Ví dụ: Tăng cơ giảm mỡ, siết cơ bụng, cải thiện độ dẻo dai cột sống, tập luyện boxing nâng cao sức bền..."
                  className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-xs font-medium text-slate-900 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74] transition-all"
                />
              </div>
            </div>

            {/* Section 4: Lịch sử đo InBody gần đây */}
            {inbodyLogs.length > 0 && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Lịch sử kiểm tra InBody tại quầy
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Dữ liệu đo đạc chỉ số cơ thể qua các lần kiểm tra
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#008b74]">
                    {inbodyLogs.length} bản ghi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Ngày đo</th>
                        <th className="py-2.5 px-3">Cân nặng</th>
                        <th className="py-2.5 px-3">Khối lượng cơ</th>
                        <th className="py-2.5 px-3">Mỡ cơ thể</th>
                        <th className="py-2.5 px-3">BMI</th>
                        <th className="py-2.5 px-3">Mỡ nội tạng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {inbodyLogs.slice(-5).reverse().map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {new Date(log.measuredAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-2.5 px-3">{log.weightKg} kg</td>
                          <td className="py-2.5 px-3">{log.muscleMassKg} kg</td>
                          <td className="py-2.5 px-3">{log.bodyFatPct}%</td>
                          <td className="py-2.5 px-3">{log.bmi}</td>
                          <td className="py-2.5 px-3">Cấp {log.visceralFatLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions Form Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={fetchData}
                disabled={saving}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Hoàn tác</span>
              </Button>

              <Button
                type="submit"
                variant="mint"
                disabled={saving}
                className="rounded-xl px-6 py-2.5 text-xs font-bold shadow-md shadow-emerald-700/10 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Đang lưu thay đổi..." : "Cập nhật hồ sơ"}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
