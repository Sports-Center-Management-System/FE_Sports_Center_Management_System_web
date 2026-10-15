import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import type { Coach, Plan, Quote } from "@/lib/types";
import {
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

export const VipQuotationPage: React.FC = () => {
  const [params] = useSearchParams();
  const planId = params.get("planId") ?? "";
  const { user } = useSession();
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState("");

  const plans = useQuery({
    queryKey: ["catalog", "all"],
    queryFn: () => get<Plan[]>("/memberships/plans", true),
  });

  const plan = plans.data?.find((item) => item.id === planId);
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => get<Coach[]>("/coaches") });

  const compatible =
    coaches.data?.filter((coach) =>
      coach.coachProfile?.coachSpecialties?.some(
        (entry) => entry.specialty.disciplineId === plan?.disciplineId
      )
    ) ?? [];

  const selectedCoach = compatible.find((c) => c.id === coachId);

  const quote = useQuery({
    queryKey: ["quote", planId, coachId],
    queryFn: () => get<Quote>(`/billing/quotations/vip${query({ planId, coachId })}`),
    enabled: Boolean(plan?.packageTier === "VIP" && coachId),
  });

  const checkout = useMutation({
    mutationFn: () => createCheckout(user!.id, { kind: "NEW_SUBSCRIPTION", planId, coachId }),
    onSuccess: (order) => {
      sessionStorage.setItem(
        `sportscenter.quote:${order.checkoutId}`,
        String(quote.data?.totalAmount ?? "")
      );
      navigate(`/portal/member/checkouts/${order.checkoutId}`);
    },
  });

  const currentDate = new Date().toLocaleDateString("vi-VN");

  return (
    <div className="w-full max-w-4xl mx-auto py-1">
      {/* Top Bar: Sharp-Cornered Back Button & Title */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <Link
            to="/portal/member/plans"
            className="h-8 px-3 rounded-none bg-white border border-slate-900 hover:bg-slate-100 text-slate-900 inline-flex items-center gap-1.5 text-xs font-bold transition-colors shrink-0"
            title="Quay lại danh mục gói tập"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Báo giá VIP theo huấn luyện viên
          </h1>
        </div>

        <span className="text-[11px] font-mono text-slate-600 uppercase tracking-widest hidden sm:inline-block">
          SỐ CHỨNG TỪ: QUOTE-VIP-{planId ? planId.slice(0, 8).toUpperCase() : "DRAFT"}
        </span>
      </div>

      <StateMessage
        loading={plans.isPending || coaches.isPending}
        error={plans.error ?? coaches.error}
      />

      {/* Notice States */}
      {plans.data && !plan && (
        <div
          role="alert"
          className="p-3.5 rounded-none bg-slate-50 border border-slate-900 text-slate-900 text-xs sm:text-sm font-medium my-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Không tìm thấy gói đang bán.</span>
          </div>
          <Link
            to="/portal/member/plans"
            className="font-bold underline text-slate-900 hover:text-black"
          >
            Xem catalog
          </Link>
        </div>
      )}

      {plan && plan.packageTier !== "VIP" && (
        <div className="p-3.5 rounded-none bg-slate-50 border border-slate-900 text-slate-900 text-xs sm:text-sm font-medium my-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>Gói này dùng giá catalog thông thường (không cần báo giá riêng).</span>
          </div>
          <Link
            to="/portal/member/plans"
            className="font-bold underline text-slate-900 hover:text-black"
          >
            Quay lại
          </Link>
        </div>
      )}

      {/* Sharp-Cornered Monochromatic White Paper Invoice */}
      {plan?.packageTier === "VIP" && (
        <article className="card bg-white rounded-none border-2 border-slate-900 p-4 sm:p-5 text-slate-900 shadow-none">
          {/* Invoice Header Block */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-slate-900 gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">
                TRUNG TÂM THỂ THAO CAO CẤP · PHIẾU BÁO GIÁ HỘI VIÊN VIP
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {plan.name}
              </h2>
              <span className="pill inline-block mt-1 px-2 py-0.5 rounded-none text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white">
                {plan.discipline?.name} · VIP
              </span>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-700 space-y-0.5">
              <p>
                Ngày lập: <strong>{currentDate}</strong>
              </p>
              <p>
                Hội viên: <strong className="text-slate-900">{user?.fullName ?? user?.email}</strong>
              </p>
              <p>
                Thời hạn gói: <strong className="text-slate-900">{plan.durationDays} ngày hiệu lực</strong>
              </p>
            </div>
          </div>

          {/* Invoice Line Items Table */}
          <div className="py-2.5">
            <table className="w-full text-xs sm:text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] uppercase font-bold tracking-wider text-left">
                  <th className="border border-slate-300 p-2 text-center w-10">STT</th>
                  <th className="border border-slate-300 p-2">Hạng mục dịch vụ</th>
                  <th className="border border-slate-300 p-2 text-center w-28">Số lượng</th>
                  <th className="border border-slate-300 p-2 text-right w-36">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Base VIP Plan */}
                <tr>
                  <td className="border border-slate-300 p-2.5 text-center text-slate-500 font-mono">01</td>
                  <td className="border border-slate-300 p-2.5">
                    <p className="font-bold text-slate-900">
                      Gói tập VIP cơ bản ({plan.discipline?.name})
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Bao gồm {plan.groupSessionQuota ?? 0} buổi lớp nhóm + quyền ra vào phòng tập không giới hạn
                    </p>
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center text-slate-700 font-medium whitespace-nowrap">
                    1 gói
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                    {money(plan.price)}
                  </td>
                </tr>

                {/* Row 2: Coach Selection Line Item */}
                <tr>
                  <td className="border border-slate-300 p-2.5 text-center text-slate-500 font-mono">02</td>
                  <td className="border border-slate-300 p-2.5">
                    <p className="font-bold text-slate-900">
                      Huấn luyện viên cá nhân (PT 1:1) kèm riêng
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <label className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
                        <span>Chọn HLV:</span>
                        <select
                          aria-label="Chọn HLV"
                          value={coachId}
                          onChange={(e) => setCoachId(e.target.value)}
                          className="h-8 px-2 py-0.5 text-xs font-semibold rounded-none border border-slate-400 bg-white text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                        >
                          <option value="">Chọn HLV phù hợp</option>
                          {compatible.map((coach) => (
                            <option key={coach.id} value={coach.id}>
                              {coach.fullName}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedCoach && (
                        <span className="text-xs text-slate-600 italic">
                          (
                          {selectedCoach.coachProfile?.coachSpecialties
                            ?.map((s) => s.specialty.name)
                            .join(", ") || "HLV chuyên nghiệp"}
                          )
                        </span>
                      )}
                    </div>

                    {compatible.length === 0 && (
                      <p className="muted text-xs text-slate-600 mt-1">
                        Chưa có HLV phù hợp với môn này.
                      </p>
                    )}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center text-slate-700 font-medium whitespace-nowrap">
                    {plan.ptSessionQuota ?? 0} buổi PT
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                    {quote.data ? (
                      money(quote.data.ptAmount)
                    ) : (
                      <span className="text-slate-400 font-normal italic">Chờ chọn HLV</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Invoice Bottom: Calculation & Action */}
          <div className="pt-2.5 border-t border-slate-900">
            {!coachId ? (
              <div className="p-3 rounded-none bg-slate-50 border border-slate-300 text-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-600 shrink-0" />
                  <p className="muted font-bold m-0 text-slate-900">Chọn HLV để máy chủ tính giá.</p>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Hệ thống sẽ lấy đơn giá theo từng buổi của HLV để cộng thành tiền
                </span>
              </div>
            ) : (
              <div>
                <StateMessage
                  loading={quote.isPending}
                  error={quote.error}
                  onRetry={() => void quote.refetch()}
                />

                {quote.data && (
                  <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                    {/* Left: Invoice Notes */}
                    <div className="text-xs text-slate-600 space-y-1 w-full sm:w-auto">
                      <p className="muted m-0 flex items-start gap-1.5 leading-relaxed">
                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>Giá chỉ để tham khảo; checkout sẽ tính lại và khóa snapshot.</span>
                      </p>
                      <p className="text-[11px] text-slate-500 m-0 pl-5">
                        * Đơn giá PT phụ thuộc vào cấp bậc và kinh nghiệm của Huấn luyện viên đã chọn.
                      </p>
                    </div>

                    {/* Right: Subtotal, Total, & Button */}
                    <div className="w-full sm:w-80 shrink-0 space-y-1 text-xs text-right">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">Giá gốc:</span>
                        <span className="font-bold text-slate-900">
                          {money(quote.data.baseAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-700">
                        <span className="font-medium">
                          {quote.data.ptSessions} PT × {money(quote.data.ratePerSession)}:
                        </span>
                        <span className="font-bold text-slate-900">
                          {money(quote.data.ptAmount)}
                        </span>
                      </div>

                      <div className="pt-2 border-t-2 border-slate-900 flex items-baseline justify-between">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
                          Tổng cộng:
                        </span>
                        <p className="price text-xl sm:text-2xl font-black text-slate-950 m-0 whitespace-nowrap">
                          {money(quote.data.totalAmount)}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="default"
                        size="default"
                        disabled={checkout.isPending || !quote.data.eligible}
                        onClick={() => checkout.mutate()}
                        className="w-full mt-2 h-11 rounded-none bg-slate-900 hover:bg-black text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkout.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang xử lý đơn...</span>
                          </>
                        ) : (
                          <>
                            <span>Tạo checkout</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {checkout.error && (
              <div
                role="alert"
                className="text-error mt-2.5 p-2.5 rounded-none bg-slate-100 border border-slate-900 text-xs font-semibold text-rose-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorText(checkout.error)}</span>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
};

export default VipQuotationPage;
