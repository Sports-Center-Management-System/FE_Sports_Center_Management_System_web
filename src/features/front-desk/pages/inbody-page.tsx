import React, { type FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { InbodyPanel } from "../components/inbody-panel";
import { PosMemberSearch } from "../components/pos-member-search";
import { memberError } from "../lib/member-error";
import { getMemberDetail } from "../services/member-management.service";
import { getCoachTodaySchedule } from "../services/inbody.service";
import type { MemberDetail } from "../types/member-management.types";
import type { SearchMember } from "../types/gate-checkin.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const InbodyPage: React.FC = () => {
  const { user } = useAuth();
  const isCoach = user?.role === "COACH";
  const [clients, setClients] = useState<MemberDetail[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchMember | null>(null);
  const [memberId, setMemberId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupVersion = useRef(0);

  useEffect(() => {
    if (!isCoach) { setScheduleLoading(false); return; }
    let active = true;
    setScheduleLoading(true);
    getCoachTodaySchedule().then(async (schedule) => {
      const ids = [...new Set(schedule.pt.flatMap((slot) => slot.bookings.map((booking) => booking.memberId)))];
      const results = await Promise.allSettled(ids.map((id) => getMemberDetail(id)));
      if (active) setClients(results.flatMap((result) => result.status === "fulfilled" && result.value.role === "MEMBER" ? [result.value] : []));
    }).catch((cause) => { if (active) setScheduleError(memberError(cause, "Không tải được lịch PT hôm nay.")); })
      .finally(() => { if (active) setScheduleLoading(false); });
    return () => { active = false; };
  }, [isCoach]);

  const lookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = memberId.trim();
    if (!uuidPattern.test(id)) { setLookupError("Nhập đúng mã UUID của hội viên."); return; }
    const version = ++lookupVersion.current;
    setLookingUp(true);
    setLookupError(null);
    try {
      const member = await getMemberDetail(id);
      if (version !== lookupVersion.current) return;
      if (member.role !== "MEMBER" || !member.isActive) {
        setLookupError("Mã này không thuộc hội viên đang hoạt động.");
        return;
      }
      setSelected(member);
    } catch (cause) {
      if (version === lookupVersion.current) setLookupError(memberError(cause, "Không tìm thấy hội viên hoặc bạn không có quyền truy cập."));
    } finally {
      if (version === lookupVersion.current) setLookingUp(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={isCoach ? "/portal/coach/schedule" : "/portal/desk"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008b74] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {isCoach ? "Lịch HLV" : "Bàn lễ tân"}
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
            Chỉ số InBody hội viên
          </h1>
          <p className="text-xs text-white mt-0.5">
            Theo dõi tiến trình cơ - mỡ, khối lượng cơ xương và lịch sử đo định kỳ
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#008b74] border border-emerald-200/70 self-start sm:self-auto">
          {isCoach ? "Huấn luyện viên" : "Bàn lễ tân"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:sticky lg:top-5">
          {isCoach ? (
            <>
              <h2 className="text-base font-bold text-slate-900">Khách PT hôm nay</h2>
              {scheduleLoading ? (
                <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
              ) : scheduleError ? (
                <p role="alert" className="mt-4 text-sm text-rose-600">{scheduleError}</p>
              ) : !clients.length ? (
                <p className="mt-4 text-sm text-slate-500">Không có khách PT trong lịch hôm nay.</p>
              ) : (
                <div className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto border-y border-slate-100">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        lookupVersion.current += 1;
                        setSelected(client);
                        setLookupError(null);
                        setMemberId(client.id);
                      }}
                      className={`flex w-full items-center gap-3 px-2 py-3 text-left text-sm rounded-xl transition-colors ${
                        selected?.id === client.id ? "bg-emerald-50 text-[#008b74]" : "hover:bg-slate-50"
                      }`}
                    >
                      <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 truncate font-semibold text-slate-800">{client.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={(event) => void lookup(event)} className="mt-6 border-t border-slate-100 pt-5">
                <label htmlFor="coach-member-id" className="text-sm font-semibold text-slate-900">
                  Mã hội viên được phân công
                </label>
                <p className="mt-1 text-xs text-slate-500">Dùng mã UUID trên hồ sơ khi hội viên không có lịch PT hôm nay.</p>
                <div className="mt-3 flex gap-2">
                  <input
                    id="coach-member-id"
                    value={memberId}
                    onChange={(event) => {
                      lookupVersion.current += 1;
                      setMemberId(event.target.value);
                      setLookingUp(false);
                      setLookupError(null);
                    }}
                    placeholder="UUID hội viên"
                    autoComplete="off"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="mint"
                    disabled={lookingUp}
                    title="Mở hồ sơ hội viên"
                    aria-label="Mở hồ sơ hội viên"
                    className="rounded-xl"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {lookupError && <p role="alert" className="mt-3 text-sm text-rose-600">{lookupError}</p>}
              </form>
            </>
          ) : (
            <PosMemberSearch
              selected={selected}
              onSelect={setSelected}
              disabled={false}
              placeholder="SĐT, họ tên hoặc email"
              inputMode="text"
              minimumLength={2}
              resultsClassName="max-h-[60vh]"
              showEmail
            />
          )}
        </aside>

        <div className="min-w-0 rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
          {selected ? (
            <>
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{selected.fullName}</h2>
                <p className="mt-1 text-sm text-slate-500">{selected.phone || selected.email}</p>
              </div>
              <InbodyPanel key={selected.id} memberId={selected.id} memberName={selected.fullName} />
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
              <UserRound className="h-10 w-10 text-slate-300" />
              <p className="font-medium">Chọn hội viên để xem và nhập chỉ số InBody.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
