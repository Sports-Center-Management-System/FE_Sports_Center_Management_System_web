import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Activity, ArrowLeft, CalendarDays, CreditCard, LogOut, Pencil, ScanLine,
  RefreshCw, UserRound, UsersRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { EditMemberModal, SubscriptionStatusModal } from "../components/member-modals";
import { InbodyPanel } from "../components/inbody-panel";
import { PosMemberSearch } from "../components/pos-member-search";
import { formatVnd } from "../lib/currency";
import { formatDateTime } from "../lib/date-time";
import { memberError } from "../lib/member-error";
import {
  getMemberDetail, getMemberHistory, getMemberSubscriptions,
  getRecentMemberInvoices,
} from "../services/member-management.service";
import type { Attendance } from "../types/front-desk.types";
import type { SearchMember } from "../types/gate-checkin.types";
import type { MemberDetail, MemberInvoice } from "../types/member-management.types";
import type { PosSubscription } from "../types/pos.types";

type DetailTab = "OVERVIEW" | "ATTENDANCE" | "INVOICES" | "INBODY";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric",
});
const formatDate = (value: string): string => dateFormatter.format(new Date(value));

const statusText: Record<string, string> = {
  ACTIVE: "Đang hoạt động", FROZEN: "Đang đóng băng", EXPIRED: "Hết hạn",
  PRESENT: "Có mặt", ABSENT: "Vắng", LATE: "Đi muộn",
};
const paymentText: Record<string, string> = {
  CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ", FREE: "Miễn phí", MOCK: "Thanh toán thử",
};
const invoiceStatusText: Record<string, string> = {
  PAID: "Đã thanh toán", PENDING: "Chờ thanh toán", REFUNDED: "Đã hoàn tiền", CANCELLED: "Đã hủy",
};

export const MembersPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SearchMember | null>(null);
  const [routeLoading, setRouteLoading] = useState(Boolean(memberId));
  const [routeError, setRouteError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("OVERVIEW");
  const [profile, setProfile] = useState<MemberDetail | null>(null);
  const [subscriptions, setSubscriptions] = useState<PosSubscription[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [invoices, setInvoices] = useState<MemberInvoice[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [attendancesError, setAttendancesError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PosSubscription | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const id = memberId ?? null;
    if (selectedIdRef.current === id) return;
    const version = ++requestVersionRef.current;
    selectedIdRef.current = id;
    setSelected(null);
    setTab("OVERVIEW");
    setNotice(null);
    setEditing(false);
    setStatusTarget(null);
    setRouteError(null);
    setRouteLoading(Boolean(id));
    if (!id) return;
    getMemberDetail(id).then((member) => {
      if (requestVersionRef.current === version) {
        if (member.role === "MEMBER") setSelected(member);
        else setRouteError("Mã này không thuộc hồ sơ hội viên.");
      }
    }).catch((error) => {
      if (requestVersionRef.current === version) setRouteError(memberError(error, "Không mở được hồ sơ hội viên."));
    }).finally(() => {
      if (requestVersionRef.current === version) setRouteLoading(false);
    });
  }, [memberId]);

  useEffect(() => {
    if (!selected) {
      setProfile(null); setSubscriptions([]); setAttendances([]); setInvoices([]);
      setProfileLoading(false); setSubscriptionsLoading(false); setAttendancesLoading(false); setInvoicesLoading(false);
      setProfileError(null); setSubscriptionsError(null); setAttendancesError(null); setInvoicesError(null);
      return;
    }
    let active = true;
    const id = selected.id;
    const version = requestVersionRef.current;
    const isCurrent = () => active && selectedIdRef.current === id && requestVersionRef.current === version;
    setProfile(null); setSubscriptions([]); setAttendances([]); setInvoices([]);
    setProfileLoading(true); setSubscriptionsLoading(true); setAttendancesLoading(true); setInvoicesLoading(true);
    setProfileError(null); setSubscriptionsError(null); setAttendancesError(null); setInvoicesError(null);
    getMemberDetail(id).then((value) => { if (isCurrent()) setProfile(value); })
      .catch((error) => { if (isCurrent()) setProfileError(memberError(error, "Không tải được hồ sơ hội viên.")); })
      .finally(() => { if (isCurrent()) setProfileLoading(false); });
    getMemberSubscriptions(id).then((value) => { if (isCurrent()) setSubscriptions(value); })
      .catch((error) => { if (isCurrent()) setSubscriptionsError(memberError(error, "Không tải được gói tập.")); })
      .finally(() => { if (isCurrent()) setSubscriptionsLoading(false); });
    getMemberHistory(id).then((value) => { if (isCurrent()) setAttendances(value); })
      .catch((error) => { if (isCurrent()) setAttendancesError(memberError(error, "Không tải được lịch sử điểm danh.")); })
      .finally(() => { if (isCurrent()) setAttendancesLoading(false); });
    getRecentMemberInvoices(id).then((value) => { if (isCurrent()) setInvoices(value); })
      .catch((error) => { if (isCurrent()) setInvoicesError(memberError(error, "Không tải được hóa đơn.")); })
      .finally(() => { if (isCurrent()) setInvoicesLoading(false); });
    return () => { active = false; };
  }, [selected?.id, refreshKey]);

  const chooseMember = (member: SearchMember | null) => {
    requestVersionRef.current += 1;
    selectedIdRef.current = member?.id ?? null;
    setProfile(null);
    setSubscriptions([]);
    setAttendances([]);
    setInvoices([]);
    setProfileError(null);
    setSubscriptionsError(null);
    setAttendancesError(null);
    setInvoicesError(null);
    setProfileLoading(Boolean(member));
    setSubscriptionsLoading(Boolean(member));
    setAttendancesLoading(Boolean(member));
    setInvoicesLoading(Boolean(member));
    setSelected(member);
    setRefreshKey((current) => current + 1);
    setTab("OVERVIEW");
    setNotice(null);
    setEditing(false);
    setStatusTarget(null);
    setRouteError(null);
    setRouteLoading(false);
    navigate(member ? `/portal/desk/members/${encodeURIComponent(member.id)}` : "/portal/desk/members");
  };
  const refresh = () => {
    requestVersionRef.current += 1;
    setRefreshKey((current) => current + 1);
  };
  const onProfileSaved = (updated: MemberDetail) => {
    setEditing(false);
    setSelected(updated);
    setProfile(updated);
    setNotice("Đã cập nhật hồ sơ hội viên.");
    refresh();
  };
  const onStatusSaved = () => {
    setStatusTarget(null);
    setNotice("Đã cập nhật trạng thái gói tập.");
    refresh();
  };
  const currentSubscriptions = subscriptions.filter((item) => item.status === "ACTIVE" || item.status === "FROZEN");

  return <div className="min-h-screen bg-[#f7f9f8] text-[#172b28]">
    <header className="border-b border-[#dce7e2] bg-white">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/portal/desk" className="flex min-w-0 items-center gap-3 text-sm font-semibold"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#008b74] text-white"><Activity className="h-5 w-5" /></span><span className="max-w-[210px] leading-tight">Sports Center Management System</span></Link>
        <div className="flex items-center gap-3 text-sm"><span className="hidden text-[#61756f] sm:inline">{user?.fullName}</span><Button type="button" variant="ghost" onClick={() => void logout()}><LogOut />Đăng xuất</Button></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><Link to="/portal/desk" className="inline-flex items-center gap-2 text-sm font-medium text-[#008b74] hover:underline"><ArrowLeft className="h-4 w-4" />Bàn lễ tân</Link><h1 className="mt-3 text-2xl font-bold">Tra cứu hội viên</h1></div><span className="border-l-2 border-[#008b74] pl-3 text-sm font-medium text-[#61756f]">Hồ sơ & lịch sử</span></div>
      {notice && <div role="status" className="mb-4 flex items-center justify-between gap-3 border-l-2 border-[#008b74] bg-white px-4 py-3 text-sm"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} title="Đóng thông báo" aria-label="Đóng thông báo" className="text-[#008b74]"><X className="h-4 w-4" /></button></div>}
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-md border border-[#d6e6dd] bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <PosMemberSearch selected={selected} onSelect={chooseMember} disabled={editing || Boolean(statusTarget)} placeholder="SĐT, họ tên hoặc email" inputMode="text" minimumLength={2} resultsClassName="max-h-[60vh]" showEmail />
        </aside>

        <div className="min-w-0 rounded-md border border-[#d6e6dd] bg-white shadow-sm">
          {!selected ? <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-5 text-center text-sm text-[#71867b]"><UsersRound className="h-8 w-8" /><p role={routeError ? "alert" : "status"}>{routeError ?? (routeLoading ? "Đang mở hồ sơ hội viên..." : "Chưa chọn hội viên.")}</p></div> : <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dce8e2] p-5 sm:p-7">
              <div className="flex min-w-0 items-center gap-4">
                {profile?.avatarUrl || selected.avatarUrl ? <img src={profile?.avatarUrl || selected.avatarUrl || ""} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8f3ed] text-[#008b74]"><UserRound className="h-6 w-6" /></span>}
                <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{profile?.fullName || selected.fullName}</h2><p className="mt-1 text-sm text-[#61756f]">{profile?.phone || selected.phone || "Chưa có SĐT"}</p></div>
              </div>
              <div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" title="Tải lại hồ sơ" aria-label="Tải lại hồ sơ" onClick={refresh}><RefreshCw /></Button><Button type="button" variant="mint" disabled={!profile || profileLoading} onClick={() => setEditing(true)}><Pencil />Cập nhật</Button></div>
            </div>
            <div role="tablist" aria-label="Thông tin hội viên" className="flex overflow-x-auto border-b border-[#dce8e2] px-5 text-sm sm:px-7">
              {([["OVERVIEW", "Tổng quan", UserRound], ["ATTENDANCE", "Điểm danh", CalendarDays], ["INVOICES", "Hóa đơn", CreditCard], ["INBODY", "InBody", ScanLine]] as const).map(([value, label, Icon]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-medium ${tab === value ? "border-[#008b74] text-[#008b74]" : "border-transparent text-[#61756f] hover:text-[#172b28]"}`}><Icon className="h-4 w-4" />{label}</button>)}
            </div>
            <div className="p-5 sm:p-7">
              {tab === "INBODY" && <InbodyPanel key={selected.id} memberId={selected.id} memberName={profile?.fullName || selected.fullName} />}
              {tab === "OVERVIEW" && <div className="space-y-7">
                <section aria-labelledby="member-profile-title"><h3 id="member-profile-title" className="text-sm font-semibold">Thông tin hội viên</h3>
                  {profileLoading ? <div className="mt-4 h-24 animate-pulse rounded-md bg-[#edf5f0]" /> : profileError ? <p role="alert" className="mt-4 text-sm text-[#ae3b2d]">{profileError}</p> : profile ? <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-[#61756f]">Email</dt><dd className="mt-1 break-all font-medium">{profile.email}</dd></div><div><dt className="text-[#61756f]">Mã hội viên</dt><dd className="mt-1 break-all font-mono text-xs">{profile.id}</dd></div>
                    <div><dt className="text-[#61756f]">Mục tiêu tập luyện</dt><dd className="mt-1 whitespace-pre-wrap font-medium">{profile.memberProfile?.fitnessGoals || "Chưa có"}</dd></div><div><dt className="text-[#61756f]">Tiền sử sức khỏe</dt><dd className="mt-1 whitespace-pre-wrap font-medium">{profile.memberProfile?.medicalHistory || "Chưa có"}</dd></div>
                  </dl> : null}
                </section>
                <section aria-labelledby="member-subscriptions-title" className="border-t border-[#dce8e2] pt-6"><div className="flex items-center justify-between gap-3"><h3 id="member-subscriptions-title" className="text-sm font-semibold">Gói tập</h3><span className="text-xs text-[#61756f]">{currentSubscriptions.length} gói đang hoạt động / đóng băng</span></div>
                  {subscriptionsLoading ? <div className="mt-4 h-24 animate-pulse rounded-md bg-[#edf5f0]" /> : subscriptionsError ? <p role="alert" className="mt-4 text-sm text-[#ae3b2d]">{subscriptionsError}</p> : !subscriptions.length ? <p className="mt-4 text-sm text-[#61756f]">Chưa có gói tập.</p> : <div className="mt-4 divide-y divide-[#e5eee8] border-y border-[#dce8e2]">{subscriptions.map((sub) => <div key={sub.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{sub.plan.name}</strong><span className={`rounded px-2 py-0.5 text-xs font-semibold ${sub.status === "ACTIVE" ? "bg-[#e4f5ec] text-[#008b74]" : sub.status === "FROZEN" ? "bg-[#fff1e3] text-[#a65a1f]" : "bg-[#eef1ef] text-[#61756f]"}`}>{statusText[sub.status] ?? sub.status}</span></div>
                      <p className="mt-2 text-xs text-[#61756f]">{formatDate(sub.startDate)} – {formatDate(sub.endDate)}{sub.assignedCoach ? ` · HLV ${sub.assignedCoach.fullName}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-5 text-sm"><span>Nhóm: <strong>{sub.remainingGroupSessions ?? 0}</strong></span><span>PT: <strong>{sub.remainingPtSessions ?? 0}</strong></span></div>
                    </div>{(sub.status === "ACTIVE" || sub.status === "FROZEN") && <Button type="button" size="sm" variant="outline" onClick={() => setStatusTarget(sub)}>{sub.status === "ACTIVE" ? "Đóng băng" : "Kích hoạt"}</Button>}
                  </div>)}</div>}
                </section>
              </div>}
              {tab === "ATTENDANCE" && <section aria-labelledby="attendance-title"><h3 id="attendance-title" className="text-sm font-semibold">Lịch sử điểm danh</h3><p className="mt-1 text-xs text-[#61756f]">Tối đa 200 lượt gần nhất.</p>
                {attendancesLoading ? <div className="mt-5 h-24 animate-pulse rounded-md bg-[#edf5f0]" /> : attendancesError ? <p role="alert" className="mt-5 text-sm text-[#ae3b2d]">{attendancesError}</p> : !attendances.length ? <p className="mt-5 py-8 text-center text-sm text-[#61756f]">Chưa có lượt điểm danh.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[530px] text-left text-sm"><thead><tr className="border-b border-[#dce8e2] text-xs text-[#61756f]"><th className="pb-3 font-semibold">Thời gian</th><th className="pb-3 font-semibold">Loại</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 font-semibold">Khăn</th></tr></thead><tbody>{attendances.map((row) => <tr key={row.id} className="border-b border-[#edf3ef] last:border-0"><td className="py-3">{formatDateTime(row.checkInTime)}</td><td className="py-3">{row.checkinType === "GATE_ENTRY" ? "Quẹt cổng" : "Buổi học"}</td><td className="py-3">{statusText[row.status] ?? row.status}</td><td className="py-3">{row.towelIssued ? "Có" : "Không"}</td></tr>)}</tbody></table></div>}
              </section>}
              {tab === "INVOICES" && <section aria-labelledby="invoices-title"><h3 id="invoices-title" className="text-sm font-semibold">Hóa đơn gần đây</h3><p className="mt-1 text-xs text-[#61756f]">Trong 200 hóa đơn mới nhất của trung tâm.</p>
                {invoicesLoading ? <div className="mt-5 h-24 animate-pulse rounded-md bg-[#edf5f0]" /> : invoicesError ? <p role="alert" className="mt-5 text-sm text-[#ae3b2d]">{invoicesError}</p> : !invoices.length ? <p className="mt-5 py-8 text-center text-sm text-[#61756f]">Không có hóa đơn trong dữ liệu gần đây.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-[#dce8e2] text-xs text-[#61756f]"><th className="pb-3 font-semibold">Mã hóa đơn</th><th className="pb-3 font-semibold">Ngày</th><th className="pb-3 font-semibold">Số tiền</th><th className="pb-3 font-semibold">Thanh toán</th><th className="pb-3 font-semibold">Trạng thái</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-[#edf3ef] last:border-0"><td className="py-3 font-mono text-xs">{invoice.invoiceCode}</td><td className="py-3">{formatDateTime(invoice.createdAt)}</td><td className="py-3 font-semibold">{formatVnd(invoice.amount)}</td><td className="py-3">{paymentText[invoice.paymentMethod] ?? invoice.paymentMethod}</td><td className="py-3">{invoiceStatusText[invoice.status] ?? invoice.status}</td></tr>)}</tbody></table></div>}
              </section>}
            </div>
          </>}
        </div>
      </div>
    </main>
    {editing && profile && <EditMemberModal member={profile} onClose={() => setEditing(false)} onSaved={onProfileSaved} />}
    {statusTarget && <SubscriptionStatusModal subscription={statusTarget} onClose={() => setStatusTarget(null)} onSaved={onStatusSaved} />}
  </div>;
};
