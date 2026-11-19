import React, { type FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  DoorOpen,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "../lib/date-time";
import { gateCheckin, searchMembers } from "../services/gate-checkin.service";
import type {
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
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<SearchMember[]>([]);
  const [selected, setSelected] = useState<SearchMember | null>(null);
  const [zone, setZone] = useState<LockerZone | "">("");
  const [towelIssued, setTowelIssued] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<GateCheckinResponse | null>(null);
  const searchSequence = useRef(0);
  const submittingRef = useRef(false);
  const queryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queryRef.current?.focus();
  }, []);

  const reset = () => {
    searchSequence.current += 1;
    setQuery("");
    setMembers([]);
    setSelected(null);
    setZone("");
    setTowelIssued(false);
    setSearchLoading(false);
    setSearchDone(false);
    setSearchError(null);
    setSubmitting(false);
    setSubmitError(null);
    setResult(null);
    window.setTimeout(() => queryRef.current?.focus(), 0);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setSearchError("Nhập ít nhất 2 ký tự để tìm hội viên.");
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
      const found = await searchMembers(searchTerm);
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
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/portal/desk"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008b74] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Bàn lễ tân
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
            Check-in hội viên
          </h1>
          <p className="text-xs text-white mt-0.5">
            Quẹt thẻ, tra cứu hội viên và cấp phát tủ đồ / khăn tập
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#008b74] border border-emerald-200/70 self-start sm:self-auto">
          Quầy cổng
        </span>
      </div>

      <div className="grid overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white shadow-xs lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 p-5 sm:p-7 lg:p-8">
          {!result && (
            <section aria-labelledby="member-search-title">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#008b74]">
                  01
                </span>
                <h2 id="member-search-title" className="text-base font-bold text-slate-900">
                  Tìm và chọn hội viên
                </h2>
              </div>
              <form onSubmit={(event) => void handleSearch(event)} className="mt-6 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="member-phone" className="sr-only">Số điện thoại, họ tên hoặc email hội viên</label>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={queryRef}
                    id="member-phone"
                    type="search"
                    autoComplete="off"
                    value={query}
                    disabled={submitting}
                    onChange={(event) => {
                      searchSequence.current += 1;
                      setQuery(event.target.value);
                      setMembers([]);
                      setSelected(null);
                      setSearchDone(false);
                      setSearchLoading(false);
                      setSearchError(null);
                      setSubmitError(null);
                    }}
                    placeholder="Số điện thoại, họ tên hoặc email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
                  />
                  {query && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        searchSequence.current += 1;
                        setQuery("");
                        setMembers([]);
                        setSelected(null);
                        setSearchDone(false);
                        setSearchLoading(false);
                        setSearchError(null);
                        queryRef.current?.focus();
                      }}
                      title="Xóa tìm kiếm"
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="mint"
                  disabled={searchLoading || submitting}
                  className="h-11 sm:min-w-36 rounded-xl"
                >
                  {searchLoading ? "Đang tìm..." : "Tìm hội viên"}
                </Button>
              </form>
              {searchError && (
                <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-rose-600">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {searchError}
                </p>
              )}
              {!searchLoading && !searchDone && !searchError && (
                <div className="mt-8 flex min-h-28 items-center justify-center gap-2 border-t border-slate-100 text-sm text-slate-400 sm:min-h-52">
                  <Search className="h-4 w-4" />
                  Chưa có kết quả tìm kiếm
                </div>
              )}
              {searchLoading && (
                <div className="mt-4 space-y-2" aria-label="Đang tải kết quả">
                  <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                </div>
              )}
              {searchDone && !members.length && (
                <p className="mt-6 border-t border-slate-100 py-6 text-sm text-slate-500">
                  Không tìm thấy hội viên phù hợp.
                </p>
              )}
              {members.length > 0 && (
                <div className="mt-7">
                  <p className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
                    Kết quả tìm kiếm{" "}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {members.length} hội viên
                    </span>
                  </p>
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        disabled={!member.isActive || submitting}
                        onClick={() => {
                          setSelected(member);
                          setSubmitError(null);
                        }}
                        className={`flex w-full items-center gap-3 px-2 py-3 text-left rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                          selected?.id === member.id ? "bg-emerald-50 text-[#008b74]" : "hover:bg-slate-50"
                        }`}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserRound className="h-4 w-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm text-slate-900">{member.fullName}</strong>
                          <span className="block text-xs text-slate-500">{member.phone || "Chưa có SĐT"}</span>
                        </span>
                        {!member.isActive ? (
                          <span className="text-xs text-rose-600">Ngừng hoạt động</span>
                        ) : selected?.id === member.id ? (
                          <Check className="h-5 w-5 text-[#008b74]" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {result && (
            <section role="status" aria-live="polite" className="border-l-4 border-[#008b74] px-5 py-6 sm:px-7">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#008b74]" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {result.repeated
                      ? "Hội viên đã check-in trong lượt ghé này"
                      : "Check-in thành công"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selected?.fullName}</p>
                </div>
              </div>
              <div className="mt-8 border-y border-slate-100 py-6">
                <p className="text-xs font-semibold uppercase text-slate-500">Tủ được cấp</p>
                <p className="mt-1 break-words text-4xl font-black text-[#008b74]">
                  {result.assignedLocker || "Không cấp tủ"}
                </p>
              </div>
              <Button type="button" variant="mint" onClick={reset} className="mt-8 h-11 rounded-xl">
                Check-in hội viên khác
              </Button>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
          {result ? (
            <dl className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="text-slate-500">Hội viên</dt>
                <dd className="mt-1 font-bold text-slate-900">{selected?.fullName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Thời gian check-in</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatDateTime(result.checkinTime)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Khăn</dt>
                <dd className="mt-1 font-semibold text-slate-900">{result.towelIssued ? "Đã nhận" : "Không nhận"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Loại điểm danh</dt>
                <dd className="mt-1 font-semibold text-slate-900">Quẹt cổng</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mã điểm danh</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-600">{result.attendanceId}</dd>
              </div>
            </dl>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#008b74] shadow-xs">
                  02
                </span>
                <h2 id="checkin-options-title" className="text-base font-bold text-slate-900">
                  Thông tin check-in
                </h2>
              </div>
              <div className="mt-6 border-b border-slate-200/80 pb-5">
                <p className="text-xs font-semibold uppercase text-slate-500">Hội viên</p>
                {selected ? (
                  <div className="mt-3 flex min-w-0 items-center gap-3">
                    {selected.avatarUrl ? (
                      <img
                        src={selected.avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#008b74]">
                        <UserRound className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{selected.fullName}</p>
                      <p className="text-xs text-slate-500">{selected.phone || "Chưa có SĐT"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Chưa chọn hội viên</p>
                )}
              </div>
              <form
                onSubmit={(event) => void handleCheckin(event)}
                className="flex flex-1 flex-col pt-5"
                aria-labelledby="checkin-options-title"
              >
                <label htmlFor="locker-zone" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <DoorOpen className="h-4 w-4 text-[#008b74]" /> Khu vực tủ
                </label>
                <select
                  id="locker-zone"
                  value={zone}
                  disabled={submitting}
                  onChange={(event) => setZone(event.target.value as LockerZone | "")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
                >
                  <option value="">Không cấp tủ</option>
                  {lockerZones.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <label className="mt-5 flex cursor-pointer items-center gap-3 border-t border-slate-200/80 pt-5 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={towelIssued}
                    disabled={submitting}
                    onChange={(event) => setTowelIssued(event.target.checked)}
                    className="h-4 w-4 accent-[#008b74] rounded"
                  />
                  Khách nhận khăn
                </label>
                {submitError && (
                  <p role="alert" className="mt-5 flex items-start gap-2 border-l-2 border-rose-500 bg-white px-3 py-3 text-sm text-rose-700 rounded-r-xl">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {submitError}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="mint"
                  disabled={!selected || submitting}
                  className="mt-8 h-11 w-full lg:mt-auto rounded-xl"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? "Đang check-in..." : "Xác nhận check-in"}
                </Button>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
