import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Activity, ArrowLeft, Banknote, Check, CheckCircle2, CreditCard,
  Landmark, LogOut, Minus, Plus, ReceiptText, RefreshCw, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { PosMemberSearch } from "../components/pos-member-search";
import { formatVnd } from "../lib/currency";
import { formatDateTime } from "../lib/date-time";
import { getMemberSubscriptions, getPosCoaches, getPosPlans, purchasePlan, purchasePtAddon, renewSubscription } from "../services/pos.service";
import { SearchMember } from "../types/gate-checkin.types";
import {
  AddonResponse, MembershipPlan, PackageTier, PosCoach,
  PosPaymentMethod, PosSubscription, PurchaseResponse,
} from "../types/pos.types";

type Mode = "PLAN" | "RENEW" | "ADDON";
type SaleResult = { mode: "PLAN" | "RENEW"; data: PurchaseResponse } | { mode: "ADDON"; data: AddonResponse; sessions: number };

const tierLabels: Record<PackageTier, string> = {
  TRIAL: "Dùng thử", DROP_IN: "Vé lẻ", PLUS: "Plus", VIP: "VIP",
};
const paymentOptions: { value: PosPaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Tiền mặt", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Chuyển khoản", icon: Landmark },
  { value: "CARD", label: "Thẻ", icon: CreditCard },
];
const todayKey = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const transactionError = (error: unknown): { message: string; uncertain: boolean } => {
  if (!axios.isAxiosError(error) || !error.response || error.response.status >= 500) {
    return {
      message: "Chưa xác định được trạng thái giao dịch. Không gửi lại; hãy kiểm tra hóa đơn với quản lý trước.",
      uncertain: true,
    };
  }
  const { status, data } = error.response as {
    status: number; data?: { errorCode?: string; message?: string | string[] };
  };
  const messages: Record<string, string> = {
    COACH_RATE_NOT_CONFIGURED: "HLV chưa có biểu phí hiệu lực trong thời gian này.",
    COACH_RATE_NOT_DEFINED: "HLV chưa có biểu phí hiệu lực trong thời gian này.",
    INVALID_PT_SUBSCRIPTION: "Hợp đồng đã hết hạn hoặc không có HLV đồng hành.",
    SUBSCRIPTION_NOT_ACTIVE: "Hợp đồng đã hết hạn hoặc không có HLV đồng hành.",
    PLAN_NOT_FOUND: "Không tìm thấy gói cước. Vui lòng tải lại danh sách.",
    PLAN_DISABLED: "Gói cước không còn được bán. Vui lòng chọn gói khác.",
    COACH_DISCIPLINE_MISMATCH: "HLV không phù hợp với bộ môn của gói cước.",
    COACH_REQUIRED: "Gói cước này cần chọn HLV đồng hành.",
    TRIAL_ALREADY_USED: "Hội viên đã sử dụng gói dùng thử cho bộ môn này.",
    SUBSCRIPTION_NOT_FOUND: "Không tìm thấy hợp đồng. Vui lòng tải lại danh sách.",
    SUBSCRIPTION_NOT_RENEWABLE: "Gói này không thể gia hạn tại quầy.",
    UNFREEZE_BEFORE_RENEWAL: "Cần kích hoạt lại gói trước khi gia hạn.",
  };
  if (data?.errorCode && messages[data.errorCode]) return { message: messages[data.errorCode], uncertain: false };
  if (status === 401) return { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", uncertain: false };
  if (status === 403) return { message: "Tài khoản không có quyền thực hiện giao dịch này.", uncertain: false };
  if (status === 409) return { message: "Giao dịch bị xung đột. Vui lòng kiểm tra hóa đơn trước khi tiếp tục.", uncertain: true };
  if (Array.isArray(data?.message)) return { message: data.message.join(" "), uncertain: false };
  if (data?.message && !/^[A-Z][A-Z0-9_]+$/.test(data.message)) return { message: data.message, uncertain: false };
  return { message: "Không thể hoàn tất giao dịch. Vui lòng kiểm tra thông tin và thử lại.", uncertain: false };
};

export const PosPage: React.FC<{ initialMode?: Mode }> = ({ initialMode = "PLAN" }) => {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [member, setMember] = useState<SearchMember | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [coaches, setCoaches] = useState<PosCoach[]>([]);
  const [subscriptions, setSubscriptions] = useState<PosSubscription[]>([]);
  const [planId, setPlanId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [sessions, setSessions] = useState("2");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("CASH");
  const [plansLoading, setPlansLoading] = useState(true);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [plansError, setPlansError] = useState(false);
  const [coachesError, setCoachesError] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const processingRef = useRef(false);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(false);
    try { setPlans(await getPosPlans()); }
    catch { setPlansError(true); }
    finally { setPlansLoading(false); }
  }, []);
  const loadCoaches = useCallback(async () => {
    setCoachesLoading(true);
    setCoachesError(false);
    try { setCoaches(await getPosCoaches()); }
    catch { setCoachesError(true); }
    finally { setCoachesLoading(false); }
  }, []);

  useEffect(() => { void loadPlans(); void loadCoaches(); }, [loadPlans, loadCoaches]);
  useEffect(() => {
    if (mode === "PLAN" || !member) {
      setSubscriptions([]);
      setSubscriptionsLoading(false);
      setSubscriptionsError(false);
      return;
    }
    let active = true;
    setSubscriptions([]);
    setSubscriptionsLoading(true);
    setSubscriptionsError(false);
    getMemberSubscriptions(member.id).then((rows) => {
      if (active) setSubscriptions(rows);
    }).catch(() => {
      if (active) setSubscriptionsError(true);
    }).finally(() => {
      if (active) setSubscriptionsLoading(false);
    });
    return () => { active = false; };
  }, [mode, member]);

  const plan = plans.find((item) => item.id === planId) ?? null;
  const needsCoach = Boolean(plan && (plan.packageTier === "VIP" || (plan.ptSessionQuota ?? 0) > 0));
  const eligibleCoaches = useMemo(() => coaches.filter((coach) =>
    !plan?.disciplineId ? Boolean(coach.coachProfile?.coachSpecialties.length) : coach.coachProfile?.coachSpecialties.some(
      ({ specialty }) => specialty.disciplineId === plan.disciplineId,
    )), [coaches, plan?.disciplineId]);
  const today = todayKey();
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "ACTIVE" &&
    sub.assignedCoachId && sub.startDate.slice(0, 10) <= today && sub.endDate.slice(0, 10) >= today);
  const renewableSubscriptions = subscriptions.filter((sub) => sub.status !== "FROZEN" &&
    sub.packageTier !== "TRIAL" && sub.packageTier !== "DROP_IN");
  const availableSubscriptions = mode === "RENEW" ? renewableSubscriptions : activeSubscriptions;
  const subscription = availableSubscriptions.find((item) => item.id === subscriptionId) ?? null;
  const sessionCount = Number(sessions);
  const validSessions = Number.isInteger(sessionCount) && sessionCount >= 1 && sessionCount <= 100;
  const freePlan = mode === "PLAN" && plan && Number(plan.price) === 0 && !needsCoach;
  const effectivePaymentMethod: PosPaymentMethod = freePlan ? "FREE" : paymentMethod;
  const canSubmit = Boolean(member && (mode === "PLAN"
    ? !plansLoading && !plansError && plan && (!needsCoach || (!coachesLoading && !coachesError && eligibleCoaches.some((coach) => coach.id === coachId)))
    : !subscriptionsLoading && !subscriptionsError && subscription && (mode === "RENEW" || validSessions)));

  const changeMode = (next: Mode) => {
    if (processing || uncertain) return;
    setMode(next);
    setPlanId("");
    setCoachId("");
    setSubscriptionId("");
    setConfirming(false);
    setSaleError(null);
  };
  const changeMember = (next: SearchMember | null) => {
    setMember(next);
    setPlanId("");
    setCoachId("");
    setSubscriptionId("");
    setConfirming(false);
    setSaleError(null);
  };
  const startNew = () => {
    setResult(null);
    setUncertain(false);
    setSaleError(null);
    setConfirming(false);
    setMember(null);
    setPlanId("");
    setCoachId("");
    setSubscriptionId("");
    setSessions("2");
    setPaymentMethod("CASH");
  };

  const submit = async () => {
    if (!confirming || !canSubmit || !member || processingRef.current || uncertain || result) return;
    processingRef.current = true;
    setProcessing(true);
    setSaleError(null);
    try {
      if (mode === "PLAN" && plan) {
        const sold = await purchasePlan(member.id, plan.id, needsCoach ? coachId : undefined, effectivePaymentMethod, plan.packageTier === "VIP");
        setResult({ mode: "PLAN", data: sold });
      } else if (mode === "RENEW" && subscription) {
        const sold = await renewSubscription(subscription.id, paymentMethod);
        setResult({ mode: "RENEW", data: sold });
      } else if (mode === "ADDON" && subscription) {
        const sold = await purchasePtAddon(subscription.id, sessionCount, effectivePaymentMethod);
        setResult({ mode: "ADDON", data: sold, sessions: sessionCount });
      }
      setConfirming(false);
    } catch (cause) {
      const error = transactionError(cause);
      setSaleError(error.message);
      setUncertain(error.uncertain);
      setConfirming(false);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const invoice = result?.data.invoice;
  const total = result && result.mode !== "ADDON"
    ? result.data.totalAmount ?? result.data.invoice.amount
    : result?.data.amount;

  return <div className="min-h-screen bg-[#f7f9f8] text-[#172b28]">
    <header className="border-b border-[#dce7e2] bg-white">
      <div className="mx-auto flex min-h-16 max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/portal/desk" className="flex min-w-0 items-center gap-3 text-sm font-semibold">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#008b74] text-white"><Activity className="h-5 w-5" /></span>
          <span className="max-w-[210px] leading-tight">Sports Center Management System</span>
        </Link>
        <div className="flex items-center gap-3 text-sm"><span className="hidden text-[#61756f] sm:inline">{user?.fullName}</span><Button type="button" variant="ghost" onClick={() => void logout()}><LogOut />Đăng xuất</Button></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><Link to="/portal/desk" className="inline-flex items-center gap-2 text-sm font-medium text-[#008b74] hover:underline"><ArrowLeft className="h-4 w-4" />Bàn lễ tân</Link><h1 className="mt-3 text-2xl font-bold">{initialMode === "RENEW" ? "Hợp đồng hội viên" : "Bán vé & PT"}</h1></div>
        <div role="tablist" aria-label="Loại giao dịch" className="inline-flex rounded-md border border-[#ccded4] bg-white p-1 text-sm">
          <button type="button" role="tab" aria-selected={mode === "PLAN"} disabled={processing || uncertain || Boolean(result)} onClick={() => changeMode("PLAN")} className={`min-w-24 rounded px-4 py-2 font-medium ${mode === "PLAN" ? "bg-[#008b74] text-white" : "text-[#526a60] hover:bg-[#edf5f0]"}`}>Bán gói</button>
          <button type="button" role="tab" aria-selected={mode === "RENEW"} disabled={processing || uncertain || Boolean(result)} onClick={() => changeMode("RENEW")} className={`min-w-24 rounded px-4 py-2 font-medium ${mode === "RENEW" ? "bg-[#008b74] text-white" : "text-[#526a60] hover:bg-[#edf5f0]"}`}>Gia hạn</button>
          <button type="button" role="tab" aria-selected={mode === "ADDON"} disabled={processing || uncertain || Boolean(result)} onClick={() => changeMode("ADDON")} className={`min-w-24 rounded px-4 py-2 font-medium ${mode === "ADDON" ? "bg-[#008b74] text-white" : "text-[#526a60] hover:bg-[#edf5f0]"}`}>PT add-on</button>
        </div>
      </div>

      {result ? <section role="status" aria-live="polite" className="grid overflow-hidden rounded-md border border-[#d6e6dd] bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="p-6 md:p-9"><div className="flex items-center gap-3"><CheckCircle2 className="h-7 w-7 text-[#008b74]" /><h2 className="text-xl font-bold">{result.mode === "PLAN" ? "Đã xuất hóa đơn bán gói" : result.mode === "RENEW" ? "Đã gia hạn hợp đồng" : "Đã mua thêm PT"}</h2></div>
          <p className="mt-2 text-sm text-[#61756f]">{member?.fullName}</p>
          <div className="mt-7 border-y border-[#e0ebe4] py-6"><p className="text-xs font-semibold uppercase text-[#61756f]">Tổng tiền theo hóa đơn</p><p className="mt-1 text-4xl font-bold text-[#008b74]">{formatVnd(total)}</p><p className="mt-2 font-mono text-sm">{invoice?.invoiceCode}</p></div>
          {result.mode === "ADDON" && <p className="mt-5 text-sm">Đã mua <strong>{result.sessions} buổi</strong>. Còn <strong>{result.data.newRemainingPtSessions} buổi PT</strong>.</p>}
          <Button type="button" variant="mint" onClick={startNew} className="mt-7 h-10">Giao dịch mới</Button>
        </div>
        <dl className="grid content-start gap-5 border-t border-[#d6e6dd] bg-[#f0f7f3] p-6 text-sm sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0 md:p-9">
          <div><dt className="text-[#61756f]">Mã hóa đơn</dt><dd className="mt-1 break-all font-mono font-semibold">{invoice?.invoiceCode}</dd></div>
          {result.mode !== "ADDON" && <><div><dt className="text-[#61756f]">Giá gói</dt><dd className="mt-1 font-semibold">{formatVnd(result.data.baseAmount ?? invoice?.baseAmount)}</dd></div><div><dt className="text-[#61756f]">PT</dt><dd className="mt-1 font-semibold">{formatVnd(result.data.ptAmount ?? invoice?.ptAmount)}</dd></div></>}
          <div><dt className="text-[#61756f]">Thanh toán</dt><dd className="mt-1 font-semibold">{paymentOptions.find((item) => item.value === invoice?.paymentMethod)?.label ?? invoice?.paymentMethod}</dd></div>
          <div><dt className="text-[#61756f]">Thời gian</dt><dd className="mt-1 font-semibold">{invoice?.createdAt ? formatDateTime(invoice.createdAt) : "—"}</dd></div>
          <div><dt className="text-[#61756f]">Mã hợp đồng</dt><dd className="mt-1 break-all font-mono text-xs">{result.data.subscription.id}</dd></div>
          <div><dt className="text-[#61756f]">Mã hóa đơn nội bộ</dt><dd className="mt-1 break-all font-mono text-xs">{invoice?.id}</dd></div>
        </dl>
      </section> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 rounded-md border border-[#d6e6dd] bg-white p-5 shadow-sm sm:p-7">
          <PosMemberSearch selected={member} onSelect={changeMember} disabled={processing || uncertain} placeholder="SĐT, họ tên hoặc email" inputMode="text" minimumLength={2} showEmail />
          {mode === "PLAN" ? <section className="pt-6" aria-labelledby="pos-plan-heading">
            <h2 id="pos-plan-heading" className="text-base font-semibold">Gói cước</h2>
            {plansLoading ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="h-28 animate-pulse rounded-md bg-[#edf5f0]" /><div className="h-28 animate-pulse rounded-md bg-[#edf5f0]" /></div>
              : plansError ? <p role="alert" className="mt-4 flex items-center gap-3 text-sm text-[#a9382a]">Không tải được gói cước.<button type="button" onClick={() => void loadPlans()} aria-label="Tải lại gói cước" title="Tải lại gói cước"><RefreshCw className="h-4 w-4" /></button></p>
              : !plans.length ? <p className="mt-4 text-sm text-[#667b73]">Không có gói cước đang bán.</p>
              : <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{plans.map((item) => <button key={item.id} type="button" disabled={processing || uncertain} onClick={() => { setPlanId(item.id); setCoachId(""); setConfirming(false); setSaleError(null); }}
                className={`min-w-0 rounded-md border p-4 text-left transition-colors ${planId === item.id ? "border-[#008b74] bg-[#edf8f2]" : "border-[#dce8e2] hover:border-[#8ebca7]"}`}>
                <span className="flex items-start justify-between gap-2"><span className="min-w-0"><strong className="block break-words text-sm">{item.name}</strong><span className="mt-1 block text-xs text-[#61756f]">{tierLabels[item.packageTier]}{item.discipline ? ` · ${item.discipline.name}` : ""}</span></span>{planId === item.id && <Check className="h-4 w-4 shrink-0 text-[#008b74]" />}</span>
                <span className="mt-4 block text-base font-bold text-[#008b74]">{formatVnd(item.price)}</span><span className="mt-1 block text-xs text-[#61756f]">{item.durationDays} ngày{(item.ptSessionQuota ?? 0) > 0 ? ` · ${item.ptSessionQuota} buổi PT` : ""}</span>{item.description && <span className="mt-2 block text-xs text-[#61756f]">{item.description}</span>}
              </button>)}</div>}
            {plan && needsCoach && <div className="mt-6 border-t border-[#dce8e2] pt-5"><h3 className="text-sm font-semibold">HLV đồng hành</h3>
              {coachesLoading ? <div className="mt-3 h-12 animate-pulse rounded-md bg-[#edf5f0]" />
                : coachesError ? <p role="alert" className="mt-3 flex items-center gap-3 text-sm text-[#a9382a]">Không tải được HLV.<button type="button" onClick={() => void loadCoaches()} aria-label="Tải lại HLV" title="Tải lại HLV"><RefreshCw className="h-4 w-4" /></button></p>
                : eligibleCoaches.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{eligibleCoaches.map((coach) => <button key={coach.id} type="button" disabled={processing || uncertain} onClick={() => { setCoachId(coach.id); setConfirming(false); setSaleError(null); }} className={`flex min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm ${coachId === coach.id ? "border-[#008b74] bg-[#edf8f2]" : "border-[#dce8e2] hover:border-[#8ebca7]"}`}>
                  {coach.avatarUrl ? <img src={coach.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <UserRound className="h-8 w-8 shrink-0 rounded-full bg-[#edf5f0] p-2 text-[#008b74]" />}<span className="min-w-0 flex-1 truncate">{coach.fullName}</span>{coachId === coach.id && <Check className="h-4 w-4 shrink-0 text-[#008b74]" />}
                </button>)}</div> : <p className="mt-3 text-sm text-[#667b73]">Không có HLV phù hợp với gói này.</p>}
            </div>}
          </section> : <section className="pt-6" aria-labelledby="pos-addon-heading"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="pos-addon-heading" className="text-base font-semibold">{mode === "RENEW" ? "Hợp đồng có thể gia hạn" : "Hợp đồng PT đang hoạt động"}</h2>{member && <Link to={`/portal/desk/members/${encodeURIComponent(member.id)}`} className="text-sm font-medium text-[#008b74] hover:underline">Xem hồ sơ & trạng thái</Link>}</div>
            {!member ? <p className="mt-4 text-sm text-[#667b73]">Chưa chọn hội viên.</p>
              : subscriptionsLoading ? <div className="mt-4 h-20 animate-pulse rounded-md bg-[#edf5f0]" />
              : subscriptionsError ? <p role="alert" className="mt-4 text-sm text-[#a9382a]">Không tải được hợp đồng của hội viên.</p>
              : !availableSubscriptions.length ? <p className="mt-4 text-sm text-[#667b73]">{mode === "RENEW" ? "Không có hợp đồng có thể gia hạn." : "Không có hợp đồng PT đang hoạt động."}</p>
              : <div className="mt-4 space-y-2">{availableSubscriptions.map((sub) => <button key={sub.id} type="button" disabled={processing || uncertain} onClick={() => { setSubscriptionId(sub.id); setConfirming(false); setSaleError(null); }} className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-md border p-4 text-left ${subscriptionId === sub.id ? "border-[#008b74] bg-[#edf8f2]" : "border-[#dce8e2] hover:border-[#8ebca7]"}`}>
                <span className="min-w-0"><strong className="block text-sm">{sub.plan.name}</strong><span className="mt-1 block text-xs text-[#61756f]">{sub.assignedCoach ? `HLV ${sub.assignedCoach.fullName} · ` : ""}Hạn {sub.endDate.slice(0, 10)}</span></span><span className="text-sm font-semibold text-[#008b74]">{mode === "RENEW" ? sub.status === "ACTIVE" ? "Đang hoạt động" : "Đã hết hạn" : `${sub.remainingPtSessions ?? 0} buổi còn lại`}</span>
              </button>)}</div>}
            {mode === "RENEW" && subscription && <p className="mt-5 text-sm text-[#61756f]">Gói gia hạn được tạo nối tiếp theo ngày hết hạn. Tổng tiền cuối do backend ghi trên hóa đơn.</p>}
            {mode === "ADDON" && subscription && <div className="mt-6 border-t border-[#dce8e2] pt-5"><label htmlFor="addon-sessions" className="text-sm font-semibold">Số buổi mua thêm</label><div className="mt-3 inline-flex h-10 items-center overflow-hidden rounded-md border border-[#ccded4]">
              <button type="button" disabled={processing || uncertain || sessionCount <= 1} onClick={() => { setSessions(String(Math.max(1, sessionCount - 1))); setConfirming(false); }} className="flex h-10 w-10 items-center justify-center bg-[#f3f8f5] disabled:opacity-40" aria-label="Giảm số buổi"><Minus className="h-4 w-4" /></button>
              <input id="addon-sessions" type="number" min={1} max={100} step={1} value={sessions} disabled={processing || uncertain} onChange={(event) => { setSessions(event.target.value); setConfirming(false); }} className="h-10 w-16 border-x border-[#ccded4] text-center text-sm outline-none" />
              <button type="button" disabled={processing || uncertain || !validSessions || sessionCount >= 100} onClick={() => { setSessions(String(Math.min(100, sessionCount + 1))); setConfirming(false); }} className="flex h-10 w-10 items-center justify-center bg-[#f3f8f5] disabled:opacity-40" aria-label="Tăng số buổi"><Plus className="h-4 w-4" /></button>
            </div>{!validSessions && <p role="alert" className="mt-2 text-xs text-[#a9382a]">Chọn từ 1 đến 100 buổi.</p>}</div>}
          </section>}
        </div>

        <aside className="min-w-0 self-start rounded-md border border-[#d6e6dd] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-5">
          <div className="flex items-center gap-2 border-b border-[#dce8e2] pb-4"><ReceiptText className="h-5 w-5 text-[#008b74]" /><h2 className="text-base font-semibold">Tổng kết giao dịch</h2></div>
          <dl className="space-y-3 border-b border-[#dce8e2] py-5 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-[#61756f]">Hội viên</dt><dd className="min-w-0 break-words text-right font-medium">{member?.fullName ?? "Chưa chọn"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#61756f]">{mode === "PLAN" ? "Gói cước" : "Hợp đồng"}</dt><dd className="min-w-0 break-words text-right font-medium">{mode === "PLAN" ? plan?.name ?? "Chưa chọn" : subscription?.plan.name ?? "Chưa chọn"}</dd></div>
            {mode === "PLAN" && needsCoach && <div className="flex justify-between gap-3"><dt className="text-[#61756f]">HLV</dt><dd className="min-w-0 break-words text-right font-medium">{coaches.find((item) => item.id === coachId)?.fullName ?? "Chưa chọn"}</dd></div>}
            {mode === "ADDON" && <div className="flex justify-between gap-3"><dt className="text-[#61756f]">Số buổi</dt><dd className="font-medium">{validSessions ? sessionCount : "—"}</dd></div>}
          </dl>
          <div className="py-5 text-sm"><p className="text-[#61756f]">{mode === "PLAN" ? "Giá gói niêm yết" : mode === "RENEW" ? "Giá gốc gói" : "Giá PT add-on"}</p><p className="mt-1 text-xl font-bold">{mode === "PLAN" && plan ? formatVnd(plan.price) : mode === "RENEW" && subscription ? formatVnd(subscription.plan.price) : "Xác nhận trên hóa đơn"}</p>{(mode === "RENEW" || mode === "PLAN" && needsCoach) && <p className="mt-2 text-xs text-[#61756f]">Chưa gồm chi phí PT nếu có. Tổng cuối theo hóa đơn backend.</p>}</div>
          {freePlan ? <p className="border-t border-[#dce8e2] pt-5 text-sm font-semibold text-[#008b74]">Gói miễn phí</p> : <fieldset disabled={processing || uncertain} className="border-t border-[#dce8e2] pt-5"><legend className="sr-only">Phương thức thanh toán</legend><p className="mb-3 text-sm font-semibold">Thanh toán</p><div className="grid gap-2">{paymentOptions.map(({ value, label, icon: Icon }) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm ${paymentMethod === value ? "border-[#008b74] bg-[#edf8f2]" : "border-[#dce8e2]"}`}><input type="radio" name="pos-payment" value={value} checked={paymentMethod === value} onChange={() => { setPaymentMethod(value); setConfirming(false); }} className="accent-[#008b74]" /><Icon className="h-4 w-4 text-[#008b74]" />{label}</label>)}</div></fieldset>}
          {saleError && <p role="alert" className="mt-5 border-l-2 border-[#c84935] bg-[#fff5f2] p-3 text-sm text-[#a9382a]">{saleError}</p>}
          {confirming && !uncertain && <div className="mt-5 border-t border-[#dce8e2] pt-4 text-sm"><p className="font-semibold">Xác nhận {freePlan ? "xuất hóa đơn" : "thu tiền và xuất hóa đơn"}?</p><p className="mt-1 text-[#61756f]">{member?.fullName} · {freePlan ? "Miễn phí" : paymentOptions.find((item) => item.value === paymentMethod)?.label}</p></div>}
          <div className="mt-5 flex gap-2">{confirming && <Button type="button" variant="outline" disabled={processing} onClick={() => setConfirming(false)}>Quay lại</Button>}<Button type="button" variant="mint" disabled={!canSubmit || processing || uncertain} onClick={() => confirming ? void submit() : setConfirming(true)} className="min-w-0 flex-1">{processing ? "Đang xử lý..." : confirming ? "Xác nhận thanh toán" : freePlan ? "Xuất hóa đơn miễn phí" : mode === "PLAN" ? "Thanh toán & xuất hóa đơn" : mode === "RENEW" ? "Gia hạn hợp đồng" : "Mua thêm buổi PT"}</Button></div>
        </aside>
      </div>}
    </main>
  </div>;
};
