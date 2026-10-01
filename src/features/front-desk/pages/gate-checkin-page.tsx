import React, { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  DoorOpen,
  LogOut,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { formatDateTime } from "../lib/date-time";
import { gateCheckin, searchMembers } from "../services/gate-checkin.service";
import {
  GateCheckinResponse,
  LockerZone,
  SearchMember,
} from "../types/gate-checkin.types";

const lockerZones: { value: LockerZone; label: string }[] = [
  { value: "MALE_LOCKER", label: "Khu tủ nam" },
  { value: "FEMALE_LOCKER", label: "Khu tủ nữ" },
  { value: "VIP_AREA", label: "Khu VIP" },
];

const apiError = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  const { status, data } = error.response as {
    status: number;
    data?: { errorCode?: string; message?: string | string[] };
  };
  const messages: Record<string, string> = {
    GATE_ACCESS_DENIED: "Hội viên không có gói tập hợp lệ, đã hết hạn hoặc không có lịch đặt phù hợp hôm nay.",
    NO_VALID_ACTIVE_SUBSCRIPTION: "Hội viên không có gói tập hợp lệ hoặc thẻ đã hết hạn.",
    NO_AVAILABLE_LOCKER: "Khu vực đã chọn không còn tủ trống. Hãy chọn khu vực khác hoặc không cấp tủ.",
    RETURN_OVERNIGHT_LOCKER_FIRST: "Hội viên cần trả tủ của lượt ghé trước trước khi check-in mới.",
    USER_NOT_FOUND: "Không tìm thấy hội viên này. Vui lòng tìm lại.",
    INVALID_USER_ROLE_OR_INACTIVE: "Tài khoản hội viên không hoạt động hoặc không đúng vai trò.",
  };
  if (data?.errorCode && messages[data.errorCode]) return messages[data.errorCode];
  if (status === 403) return "Tài khoản này không có quyền thực hiện check-in cổng.";
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (Array.isArray(data?.message)) return data.message.join(" ");
  if (data?.message && !/^[A-Z][A-Z0-9_]+$/.test(data.message)) return data.message;
  return fallback;
};

export const GateCheckinPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState<SearchMember[]>([]);
  const [selected, setSelected] = useState<SearchMember | null>(null);
  const [zone, setZone] = useState<LockerZone | "">("");
  const [towelIssued, setTowelIssued] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GateCheckinResponse | null>(null);
  const searchSequence = useRef(0);
  const submittingRef = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { searchSequence.current += 1; }, []);

  const reset = () => {
    searchSequence.current += 1;
    setPhone("");
    setMembers([]);
    setSelected(null);
    setZone("");
    setTowelIssued(false);
    setSearchLoading(false);
    setSearchDone(false);
    setSearchError(null);
    setSubmitError(null);
    setResult(null);
    window.setTimeout(() => phoneRef.current?.focus(), 0);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = phone.trim();
    if (query.length < 4) {
      setSearchError("Nhập ít nhất 4 ký tự của số điện thoại để tìm hội viên.");
      return;
    }
    const sequence = ++searchSequence.current;
    setSearchLoading(true);
    setSearchError(null);
    setSearchDone(false);
    setMembers([]);
    setSelected(null);
    setSubmitError(null);
    try {
      const found = await searchMembers(query);
      if (sequence !== searchSequence.current) return;
      setMembers(found);
      setSearchDone(true);
    } catch (error) {
      if (sequence !== searchSequence.current) return;
      setSearchError(apiError(error, "Không thể tìm hội viên. Vui lòng thử lại."));
    } finally {
      if (sequence === searchSequence.current) setSearchLoading(false);
    }
  };

  const handleCheckin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || submittingRef.current || result) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await gateCheckin({
        userId: selected.id,
        ...(zone ? { preferredZone: zone } : {}),
        towelIssued,
      });
      setResult(response);
    } catch (error) {
      setSubmitError(apiError(error, "Check-in không thành công. Vui lòng thử lại."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-[#172b28]">
      <header className="border-b border-[#dce7e2] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link to="/portal/desk" className="flex min-w-0 items-center gap-3 text-sm font-semibold" aria-label="Về bàn lễ tân">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#008b74] text-white"><Activity className="h-5 w-5" /></span>
            <span className="max-w-[220px] leading-tight">Sports Center Management System</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[#61756f] sm:inline">{user?.fullName}</span>
            <Button type="button" variant="ghost" onClick={() => void logout()}><LogOut />Đăng xuất</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/portal/desk" className="inline-flex items-center gap-2 text-sm font-medium text-[#008b74] hover:underline"><ArrowLeft className="h-4 w-4" />Bàn lễ tân</Link>
            <h1 className="mt-3 text-2xl font-bold">Check-in hội viên</h1>
          </div>
          <span className="border-l-2 border-[#008b74] pl-3 text-sm font-medium text-[#61756f]">Quầy cổng</span>
        </div>

        <div className="grid overflow-hidden rounded-md border border-[#d8e6df] bg-white shadow-sm lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-8">
            {!result && <section aria-labelledby="member-search-title">
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e2f5ee] text-sm font-bold text-[#008b74]">01</span><h2 id="member-search-title" className="text-base font-semibold">Tìm và chọn hội viên</h2></div>
              <form onSubmit={(event) => void handleSearch(event)} className="mt-6 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="member-phone" className="sr-only">Số điện thoại hội viên</label>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a9189]" />
                  <input ref={phoneRef} id="member-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} disabled={submitting}
                    onChange={(event) => { searchSequence.current += 1; setPhone(event.target.value); setMembers([]); setSelected(null); setSearchDone(false); setSearchLoading(false); setSearchError(null); setSubmitError(null); }}
                    placeholder="Nhập số điện thoại hội viên"
                    className="h-11 w-full rounded-md border border-[#c9dad2] bg-white pl-10 pr-10 text-sm outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15" />
                  {phone && <button type="button" disabled={submitting} onClick={() => { searchSequence.current += 1; setPhone(""); setMembers([]); setSelected(null); setSearchDone(false); setSearchLoading(false); setSearchError(null); phoneRef.current?.focus(); }} title="Xóa số điện thoại" aria-label="Xóa số điện thoại" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#61756f] hover:bg-[#edf7f3] disabled:opacity-50"><X className="h-4 w-4" /></button>}
                </div>
                <Button type="submit" variant="mint" disabled={searchLoading || submitting} className="h-11 sm:min-w-36">{searchLoading ? "Đang tìm..." : "Tìm hội viên"}</Button>
              </form>
              {searchError && <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-[#ae392a]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{searchError}</p>}
              {!searchLoading && !searchDone && !searchError && <div className="mt-8 flex min-h-28 items-center justify-center gap-2 border-t border-[#e6efea] text-sm text-[#82968e] sm:min-h-52"><Search className="h-4 w-4" />Chưa có kết quả tìm kiếm</div>}
              {searchLoading && <div className="mt-4 space-y-2" aria-label="Đang tải kết quả"><div className="h-14 animate-pulse rounded-md bg-[#e2f1eb]" /><div className="h-14 animate-pulse rounded-md bg-[#e2f1eb]" /></div>}
              {searchDone && !members.length && <p className="mt-6 border-t border-[#d8e6df] py-6 text-sm text-[#61756f]">Không tìm thấy hội viên phù hợp.</p>}
              {members.length > 0 && <div className="mt-7">
                <p className="border-b border-[#d8e6df] pb-3 text-sm font-semibold">Kết quả tìm kiếm <span className="ml-2 text-xs font-normal text-[#61756f]">{members.length} hội viên</span></p>
                <div className="max-h-[340px] overflow-y-auto divide-y divide-[#edf4f0]">
                  {members.map((member) => <button key={member.id} type="button" disabled={!member.isActive || submitting} onClick={() => { setSelected(member); setSubmitError(null); }}
                    className={`flex w-full items-center gap-3 px-2 py-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${selected?.id === member.id ? "bg-[#e5f7f1]" : "hover:bg-[#f6fbf8]"}`}>
                    {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf4f0] text-[#61756f]"><UserRound className="h-4 w-4" /></span>}
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{member.fullName}</strong><span className="block text-xs text-[#61756f]">{member.phone || "Chưa có SĐT"}</span></span>
                    {!member.isActive ? <span className="text-xs text-[#ae392a]">Ngừng hoạt động</span> : selected?.id === member.id ? <Check className="h-5 w-5 text-[#008b74]" /> : null}
                  </button>)}
                </div>
              </div>}
            </section>}

            {result && <section role="status" aria-live="polite" className="border-l-4 border-[#008b74] px-5 py-6 sm:px-7">
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#008b74]" /><div><h2 className="text-lg font-bold">{result.repeated ? "Hội viên đã check-in trong lượt ghé này" : "Check-in thành công"}</h2><p className="mt-1 text-sm text-[#61756f]">{selected?.fullName}</p></div></div>
              <div className="mt-8 border-y border-[#e4f0ec] py-6"><p className="text-xs font-semibold uppercase text-[#61756f]">Tủ được cấp</p><p className="mt-1 break-words text-4xl font-bold text-[#008b74]">{result.assignedLocker || "Không cấp tủ"}</p></div>
              <Button type="button" variant="mint" onClick={reset} className="mt-8 h-11">Check-in hội viên khác</Button>
            </section>}
          </div>

          <aside className="flex min-w-0 flex-col border-t border-[#d8e6df] bg-[#f2f7f4] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            {result ? <dl className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <div><dt className="text-[#61756f]">Hội viên</dt><dd className="mt-1 font-semibold">{selected?.fullName}</dd></div>
              <div><dt className="text-[#61756f]">Thời gian check-in</dt><dd className="mt-1 font-semibold">{formatDateTime(result.checkinTime)}</dd></div>
              <div><dt className="text-[#61756f]">Khăn</dt><dd className="mt-1 font-semibold">{result.towelIssued ? "Đã nhận" : "Không nhận"}</dd></div>
              <div><dt className="text-[#61756f]">Loại điểm danh</dt><dd className="mt-1 font-semibold">Quẹt cổng</dd></div>
              <div><dt className="text-[#61756f]">Mã điểm danh</dt><dd className="mt-1 break-all font-mono text-xs">{result.attendanceId}</dd></div>
            </dl> : <>
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-bold text-[#008b74]">02</span><h2 id="checkin-options-title" className="text-base font-semibold">Thông tin check-in</h2></div>
              <div className="mt-6 border-b border-[#d8e6df] pb-5">
                <p className="text-xs font-semibold uppercase text-[#61756f]">Hội viên</p>
                {selected ? <div className="mt-3 flex min-w-0 items-center gap-3">
                  {selected.avatarUrl ? <img src={selected.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dcece4] text-[#008b74]"><UserRound className="h-5 w-5" /></span>}
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{selected.fullName}</p><p className="text-xs text-[#61756f]">{selected.phone || "Chưa có SĐT"}</p></div>
                </div> : <p className="mt-2 text-sm text-[#61756f]">Chưa chọn hội viên</p>}
              </div>
              <form onSubmit={(event) => void handleCheckin(event)} className="flex flex-1 flex-col pt-5" aria-labelledby="checkin-options-title">
                <label htmlFor="locker-zone" className="mb-2 flex items-center gap-2 text-sm font-medium"><DoorOpen className="h-4 w-4 text-[#008b74]" />Khu vực tủ</label>
                <select id="locker-zone" value={zone} disabled={submitting} onChange={(event) => setZone(event.target.value as LockerZone | "")}
                  className="h-11 w-full rounded-md border border-[#c9dad2] bg-white px-3 text-sm outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15">
                  <option value="">Không cấp tủ</option>
                  {lockerZones.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <label className="mt-5 flex cursor-pointer items-center gap-3 border-t border-[#d8e6df] pt-5 text-sm font-medium">
                  <input type="checkbox" checked={towelIssued} disabled={submitting} onChange={(event) => setTowelIssued(event.target.checked)} className="h-4 w-4 accent-[#008b74]" />Khách nhận khăn
                </label>
                {submitError && <p role="alert" className="mt-5 flex items-start gap-2 border-l-2 border-[#d7634b] bg-white px-3 py-3 text-sm text-[#a43125]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{submitError}</p>}
                <Button type="submit" variant="mint" disabled={!selected || submitting} className="mt-8 h-11 w-full lg:mt-auto"><CheckCircle2 />{submitting ? "Đang check-in..." : "Xác nhận check-in"}</Button>
              </form>
            </>}
          </aside>
        </div>
      </main>
    </div>
  );
};
