import React from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Dumbbell,
  Users,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Info,
  Building2,
} from "lucide-react";
import { MembershipPlan } from "../types/plans.types";

interface PlanDetailModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
}

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  plan,
  onClose,
}) => {
  if (!plan) return null;

  const isVip = plan.packageTier === "VIP";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`p-6 border-b border-slate-100 flex items-start justify-between ${
            isVip
              ? "bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-amber-500/5"
              : "bg-gradient-to-r from-emerald-500/10 via-emerald-100/20 to-emerald-500/5"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isVip
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-emerald-100 text-[#008b74] border-emerald-300"
                }`}
              >
                Hạng {plan.packageTier}
              </span>
              {plan.discipline && (
                <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {plan.discipline.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{plan.name}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Mã gói tập: <span className="font-mono text-slate-600">{plan.id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Price & Duration Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">
                Giá cước niêm yết
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(plan.price)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-semibold block">
                Thời hạn gói
              </span>
              <span className="text-base font-bold text-slate-800">
                {plan.durationDays >= 365 ? "Thời hạn dài hạn" : `${plan.durationDays} ngày`}
              </span>
            </div>
          </div>

          {/* Description */}
          {plan.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {plan.description}
              </p>
            </div>
          )}

          {/* Session Quotas Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#008b74]" />
              Hạn mức buổi tập & Số lượng buổi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Buổi học nhóm</span>
                <span className="text-lg font-bold text-slate-900">
                  {plan.groupSessionQuota > 0 ? `${plan.groupSessionQuota} buổi` : "0 buổi"}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {plan.groupSessionQuota > 0 ? "Theo lịch lớp của trung tâm" : "Không bao gồm"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Kèm 1:1 Coach (PT)</span>
                <span className="text-lg font-bold text-amber-700">
                  {plan.ptSessionQuota > 0 ? `${plan.ptSessionQuota} buổi` : "0 buổi"}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {plan.ptSessionQuota > 0 ? "1 kèm 1 theo giáo án riêng" : "Không bao gồm"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Tổng định mức</span>
                <span className="text-lg font-bold text-slate-900">
                  {plan.sessionQuota ? `${plan.sessionQuota} buổi` : "Tập tự do theo ngày"}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Trong suốt chu kỳ gói
                </span>
              </div>
            </div>
          </div>

          {/* Coach Policy */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#008b74]" />
              Chính sách Huấn luyện viên (Coach Policy)
            </h4>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs text-slate-700">
              {plan.ptSessionQuota > 0 ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Huấn luyện viên cá nhân 1:1:</strong>{" "}
                      Gói tập bao gồm {plan.ptSessionQuota} buổi làm việc chuyên sâu với Huấn luyện viên được chỉ định hoặc do học viên lựa chọn theo danh sách Coach chuyên môn.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Đặt và hủy lịch tập:</strong>{" "}
                      Học viên cần thỏa thuận lịch tập trước tối thiểu 4 tiếng. Trường hợp hủy buổi tập muộn hoặc vắng mặt không báo trước sẽ được tính là một lượt đã sử dụng theo quy định của hệ thống.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Thỏa thuận phụ phí Coach:</strong>{" "}
                      Áp dụng theo chính sách tổng chi phí gói cộng biểu phí huấn luyện viên (coach_rate) tương ứng trên hệ thống Backend.
                    </div>
                  </div>
                </>
              ) : plan.groupSessionQuota > 0 ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Huấn luyện viên lớp nhóm:</strong>{" "}
                      Mỗi buổi học nhóm đều có HLV chuyên môn hướng dẫn kỹ thuật, chỉnh động tác và điều phối nhịp độ buổi tập an toàn.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Quy định tham gia lớp:</strong>{" "}
                      Học viên đặt chỗ lớp nhóm trên hệ thống trước giờ học. Điểm danh tại quầy lễ tân hoặc cửa phòng tập trước giờ bắt đầu 10 phút.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Huấn luyện viên hỗ trợ sàn:</strong>{" "}
                      Được HLV trực sàn hướng dẫn nguyên tắc an toàn, tư thế khởi động và cách vận hành các thiết bị tập luyện đúng kỹ thuật.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Facility & Gym Entry Rights */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#008b74]" />
              Quyền lợi cơ sở vật chất & Ra vào cửa
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    plan.unlimitedGymEntry ? "text-[#008b74]" : "text-slate-400"
                  }`}
                />
                <span>
                  Ra vào cửa phòng Gym:{" "}
                  <strong className="text-slate-900">
                    {plan.unlimitedGymEntry
                      ? "Không giới hạn số lượt trong suốt thời hạn gói"
                      : "Theo ca học và lịch lớp đã đăng ký"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#008b74]" />
                <span>
                  Sử dụng miễn phí tủ đồ thông minh locker và phòng tắm nước nóng tiêu chuẩn.
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#008b74]" />
                <span>
                  Đo phân tích chỉ số thể chất cơ thể InBody miễn phí cùng chuyên viên tư vấn.
                </span>
              </div>
            </div>
          </div>

          {/* Notice & Regulations */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Lưu ý & Quy chế trung tâm</span>
            </div>
            <p>
              Gói tập được kích hoạt tự động sau khi thanh toán hoặc khi học viên thực hiện buổi tập đầu tiên. Quý hội viên có nhu cầu đóng băng (bảo lưu) vui lòng liên hệ quầy lễ tân để được hỗ trợ thủ tục.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Đăng ký trực tiếp tại quầy Lễ tân
            </span>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition ${
                isVip
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#008b74] hover:bg-[#007562]"
              }`}
            >
              Đã hiểu quyền lợi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
