import React, { FormEvent, useEffect, useRef, useState } from "react";
import { Activity, LogOut, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { InbodyPanel } from "../components/inbody-panel";
import { memberError } from "../lib/member-error";
import { getMemberDetail } from "../services/member-management.service";
import { getCoachTodaySchedule } from "../services/inbody.service";
import { MemberDetail } from "../types/member-management.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CoachInbodyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [clients, setClients] = useState<MemberDetail[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MemberDetail | null>(null);
  const [memberId, setMemberId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupVersion = useRef(0);

  useEffect(() => {
    let active = true;
    getCoachTodaySchedule().then(async (schedule) => {
      const ids = [...new Set(schedule.pt.flatMap((slot) => slot.bookings.map((booking) => booking.memberId)))];
      const results = await Promise.allSettled(ids.map((id) => getMemberDetail(id)));
      if (active) setClients(results.flatMap((result) => result.status === "fulfilled" && result.value.role === "MEMBER" ? [result.value] : []));
    }).catch((cause) => { if (active) setScheduleError(memberError(cause, "Không tải được lịch PT hôm nay.")); })
      .finally(() => { if (active) setScheduleLoading(false); });
    return () => { active = false; };
  }, []);

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

  return <div className="min-h-screen bg-[#f7f9f8] text-[#172b28]">
    <header className="border-b border-[#dce7e2] bg-white"><div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-8"><div className="flex min-w-0 items-center gap-3 text-sm font-semibold"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#008b74] text-white"><Activity className="h-5 w-5" /></span><span className="max-w-[210px] leading-tight">Sports Center Management System</span></div><div className="flex items-center gap-3 text-sm"><span className="hidden text-[#61756f] sm:inline">{user?.fullName}</span><Button type="button" variant="ghost" onClick={() => void logout()}><LogOut />Đăng xuất</Button></div></div></header>
    <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 md:px-8">
      <div className="mb-5"><span className="text-xs font-semibold uppercase text-[#008b74]">Huấn luyện viên</span><h1 className="mt-1 text-2xl font-bold">Chỉ số InBody hội viên</h1></div>
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-md border border-[#d6e6dd] bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <h2 className="text-base font-semibold">Khách PT hôm nay</h2>
          {scheduleLoading ? <div className="mt-4 h-20 animate-pulse rounded-md bg-[#edf5f0]" /> : scheduleError ? <p role="alert" className="mt-4 text-sm text-[#ae3b2d]">{scheduleError}</p> : !clients.length ? <p className="mt-4 text-sm text-[#61756f]">Không có khách PT trong lịch hôm nay.</p> : <div className="mt-4 max-h-72 divide-y divide-[#e7efea] overflow-y-auto border-y border-[#dce8e2]">{clients.map((client) => <button key={client.id} type="button" onClick={() => { lookupVersion.current += 1; setSelected(client); setLookupError(null); setMemberId(client.id); }} className={`flex w-full items-center gap-3 px-2 py-3 text-left text-sm ${selected?.id === client.id ? "bg-[#e6f5ed] text-[#008b74]" : "hover:bg-[#f7faf8]"}`}><UserRound className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate font-medium">{client.fullName}</span></button>)}</div>}
          <form onSubmit={(event) => void lookup(event)} className="mt-6 border-t border-[#e3eee7] pt-5"><label htmlFor="coach-member-id" className="text-sm font-semibold">Mã hội viên được phân công</label><p className="mt-1 text-xs text-[#61756f]">Dùng mã UUID trên hồ sơ khi hội viên không có lịch PT hôm nay.</p><div className="mt-3 flex gap-2"><input id="coach-member-id" value={memberId} onChange={(event) => { lookupVersion.current += 1; setMemberId(event.target.value); setLookingUp(false); setLookupError(null); }} placeholder="UUID hội viên" autoComplete="off" className="h-10 min-w-0 flex-1 rounded-md border border-[#cbded4] px-3 text-sm outline-none focus:border-[#008b74]" /><Button type="submit" size="icon" variant="mint" disabled={lookingUp} title="Mở hồ sơ hội viên" aria-label="Mở hồ sơ hội viên"><Search className="h-4 w-4" /></Button></div>{lookupError && <p role="alert" className="mt-3 text-sm text-[#ae3b2d]">{lookupError}</p>}</form>
        </aside>
        <div className="min-w-0 rounded-md border border-[#d6e6dd] bg-white p-5 shadow-sm sm:p-7">{selected ? <><div className="mb-6 border-b border-[#e3eee7] pb-4"><h2 className="text-lg font-semibold">{selected.fullName}</h2><p className="mt-1 text-sm text-[#61756f]">{selected.phone || selected.email}</p></div><InbodyPanel key={selected.id} memberId={selected.id} memberName={selected.fullName} /></> : <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-sm text-[#71867b]"><UserRound className="h-8 w-8" /><p>Chọn hội viên để xem và nhập chỉ số InBody.</p></div>}</div>
      </div>
    </main>
  </div>;
};
