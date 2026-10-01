import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import { Activity, BellRing, LogOut, ReceiptText, RefreshCw, ScanLine, UsersRound, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { CancellationModal } from "../components/cancellation-modal";
import {
  getLockerZones,
  getUpcomingClasses,
  LockerAvailability,
  PendingCancellations,
  RecentCheckins,
  UpcomingClasses,
} from "../components/dashboard-sections";
import { formatDateTime, isTodayInVietnam } from "../lib/date-time";
import {
  getCancellationRequests,
  getLockers,
  getMemberAttendances,
  getSchedules,
  getUser,
} from "../services/front-desk-api.service";
import {
  CancellationRequest,
  CancellationReviewResponse,
  CheckinRow,
  GateCheckinEvent,
  Locker,
  Schedule,
} from "../types/front-desk.types";

const getLoadError = (section: string): string => `Không thể tải ${section}. Vui lòng thử lại.`;

export const FrontDeskPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [selected, setSelected] = useState<CancellationRequest | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [lockerLoading, setLockerLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [lockerError, setLockerError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const seenRequests = useRef(new Set<string>());
  const seenCheckins = useRef(new Set<string>());
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);

  const loadSchedules = useCallback(async () => {
    try {
      setSchedules(await getSchedules());
      setScheduleError(null);
    } catch {
      setScheduleError(getLoadError("lịch lớp học"));
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const loadLockers = useCallback(async () => {
    try {
      setLockers(await getLockers());
      setLockerError(null);
    } catch {
      setLockerError(getLoadError("danh sách tủ đồ"));
    } finally {
      setLockerLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const pending = (await getCancellationRequests()).filter((item) => item.status === "PENDING");
      setRequests(pending);
      setRequestsError(null);
    } catch {
      setRequestsError(getLoadError("yêu cầu hủy ca"));
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadSchedules();
    void loadLockers();
    void loadRequests();
  }, [loadSchedules, loadLockers, loadRequests]);

  const playAlert = useCallback(() => {
    const context = audioContext.current;
    if (!soundEnabledRef.current || !context || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 740;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.34);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    } catch {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
    }
  }, []);

  const toggleSound = async () => {
    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      return;
    }
    try {
      const context = audioContext.current ?? new AudioContext();
      audioContext.current = context;
      await context.resume();
      soundEnabledRef.current = context.state === "running";
      setSoundEnabled(soundEnabledRef.current);
      if (!soundEnabledRef.current) setNotice("Trình duyệt đang chặn âm báo. Hãy thử bật lại.");
    } catch {
      setNotice("Không thể bật âm báo trên trình duyệt này.");
    }
  };

  const handleGateCheckin = useCallback(async (event: GateCheckinEvent) => {
    if (!event.attendanceId || !event.memberId || seenCheckins.current.has(event.attendanceId)) return;
    seenCheckins.current.add(event.attendanceId);
    const [userResult, attendanceResult] = await Promise.allSettled([
      getUser(event.memberId),
      getMemberAttendances(event.memberId),
    ]);
    const attendance = attendanceResult.status === "fulfilled"
      ? attendanceResult.value.find((item) => item.id === event.attendanceId && item.checkinType === "GATE_ENTRY")
      : null;
    if (!attendance) {
      seenCheckins.current.delete(event.attendanceId);
      setCheckinError("Có lượt quẹt cổng mới nhưng chưa tải được chi tiết điểm danh.");
      return;
    }
    if (!isTodayInVietnam(attendance.checkInTime)) return;
    setCheckinError(null);
    setCheckins((current) => {
      if (current.some((row) => row.id === event.attendanceId)) return current;
      return [{
        id: event.attendanceId,
        memberName: userResult.status === "fulfilled" ? userResult.value.fullName : null,
        checkInTime: attendance.checkInTime,
        lockerNumber: event.lockerNumber ?? null,
      }, ...current];
    });
    void loadLockers();
  }, [loadLockers]);

  useEffect(() => {
    refresh();
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    const poll = window.setInterval(refresh, 60_000);
    return () => { window.clearInterval(clock); window.clearInterval(poll); };
  }, [refresh]);

  useEffect(() => {
    let activeToken = localStorage.getItem("access_token");
    const socket = io(import.meta.env.VITE_REALTIME_URL || "/realtime", {
      path: "/socket.io",
      autoConnect: false,
      auth: { token: activeToken },
    });
    const updateToken = () => {
      activeToken = localStorage.getItem("access_token");
      socket.auth = { token: activeToken };
    };
    const tokenWatch = window.setInterval(() => {
      const token = localStorage.getItem("access_token");
      if (token === activeToken) return;
      activeToken = token;
      socket.auth = { token };
      socket.disconnect();
      if (token) socket.connect();
    }, 10_000);
    socket.io.on("reconnect_attempt", updateToken);
    socket.on("connect", () => { setRealtimeStatus("connected"); refresh(); });
    socket.on("disconnect", () => setRealtimeStatus("offline"));
    socket.on("connect_error", () => setRealtimeStatus("offline"));
    socket.on("gate.checked-in", (event: GateCheckinEvent) => { void handleGateCheckin(event); });
    socket.on("cancellation.requested", (request: CancellationRequest) => {
      if (!request?.id || request.status !== "PENDING") return;
      setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      if (!seenRequests.current.has(request.id)) {
        seenRequests.current.add(request.id);
        setSelected((current) => current ?? request);
        playAlert();
      }
      void loadRequests();
    });
    socket.on("cancellation.reviewed", (request: CancellationRequest) => {
      if (!request?.id) return;
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setSelected((current) => current?.id === request.id ? null : current);
      void loadRequests();
    });
    socket.on("schedule.updated", () => { void loadSchedules(); });
    socket.connect();
    return () => {
      window.clearInterval(tokenWatch);
      socket.io.off("reconnect_attempt", updateToken);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [refresh, handleGateCheckin, loadRequests, loadSchedules, playAlert]);

  useEffect(() => () => { void audioContext.current?.close(); }, []);

  const handleReviewed = (result: CancellationReviewResponse) => {
    setRequests((current) => current.filter((item) => item.id !== result.requestId));
    setSelected(null);
    setNotice(result.status === "APPROVED" ? "Đã phê duyệt yêu cầu hủy ca." : "Đã từ chối yêu cầu hủy ca.");
    refresh();
  };

  const closeModal = useCallback(() => setSelected(null), []);

  const availableLockers = getLockerZones(lockers).reduce((sum, [, count]) => sum + count.available, 0);
  const checkinsToday = checkins.filter((row) => row.checkInTime && isTodayInVietnam(row.checkInTime, now));

  return (
    <div className="min-h-screen bg-[#f1faf6] text-[#10221f]">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-[#dceee8] bg-white lg:flex lg:flex-col">
          <div className="border-b border-[#e6f2ee] px-5 py-5">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#008b74] text-white"><Activity className="h-5 w-5" /></div><strong className="text-sm leading-tight">Sports Center Management System</strong></div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-5 text-sm"><Link to="/portal/desk" className="flex items-center gap-3 rounded-md bg-[#e5f7f1] px-3 py-2.5 font-semibold text-[#008b74]"><BellRing className="h-4 w-4" />Bàn lễ tân</Link><Link to="/portal/desk/check-in" className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#47645c] hover:bg-[#f1faf6]"><ScanLine className="h-4 w-4" />Check-in cổng</Link><Link to="/portal/desk/pos" className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#47645c] hover:bg-[#f1faf6]"><ReceiptText className="h-4 w-4" />Bán vé & PT</Link><Link to="/portal/desk/members" className="flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-[#47645c] hover:bg-[#f1faf6]"><UsersRound className="h-4 w-4" />Hội viên</Link></nav>
          <div className="border-t border-[#e6f2ee] p-4 text-xs text-[#6a7d78]">{user?.fullName}<br />Lễ tân</div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-[#dceee8] bg-white px-4 py-4 md:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-xs font-semibold text-[#008b74]">SPORTS CENTER MANAGEMENT SYSTEM / LỄ TÂN</p><h1 className="mt-1 text-xl font-bold md:text-2xl">Bàn làm việc lễ tân</h1><p className="mt-1 text-xs text-[#6a7d78]">{formatDateTime(now.toISOString())}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/portal/desk/members" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cde6db] bg-white px-3 text-sm font-medium text-[#008b74] hover:bg-[#f1faf6]"><UsersRound className="h-4 w-4" />Hội viên</Link>
                <Link to="/portal/desk/pos" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cde6db] bg-white px-3 text-sm font-medium text-[#008b74] hover:bg-[#f1faf6]"><ReceiptText className="h-4 w-4" />Bán vé & PT</Link>
                <Link to="/portal/desk/check-in" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#008b74] px-3 text-sm font-medium text-white hover:bg-[#007461]"><ScanLine className="h-4 w-4" />Check-in cổng</Link>
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${realtimeStatus === "connected" ? "bg-[#e5f7f1] text-[#008b74]" : "bg-[#fff1e8] text-[#a94f20]"}`}>{realtimeStatus === "connected" ? "Realtime đang hoạt động" : realtimeStatus === "connecting" ? "Đang kết nối..." : "Mất kết nối realtime"}</span>
                <Button type="button" variant="outline" onClick={() => void toggleSound()} title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} aria-label={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} className="h-9 w-9 p-0">{soundEnabled ? <Volume2 /> : <VolumeX />}</Button>
                <Button type="button" variant="outline" onClick={refresh} title="Tải lại dữ liệu" aria-label="Tải lại dữ liệu" className="h-9 w-9 p-0"><RefreshCw /></Button>
                <Button type="button" variant="ghost" onClick={() => void logout()}><LogOut />Đăng xuất</Button>
              </div>
            </div>
          </header>

          <div className="space-y-5 px-4 py-6 md:px-7">
            {notice && <div role="status" className="flex items-center justify-between gap-3 border-l-2 border-[#008b74] bg-white px-4 py-3 text-sm"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} className="text-[#008b74]">Đóng</button></div>}
            <div className="grid grid-cols-2 gap-3 border-b border-[#dceee8] pb-5 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-[#6a7d78]">Quẹt cổng trong phiên</p><p className="mt-1 text-xl font-bold">{checkinsToday.length}</p></div>
              <div><p className="text-xs text-[#6a7d78]">Lớp sắp bắt đầu</p><p className="mt-1 text-xl font-bold">{scheduleLoading || scheduleError ? "—" : getUpcomingClasses(schedules, now).length}</p></div>
              <div><p className="text-xs text-[#6a7d78]">Tủ còn trống</p><p className="mt-1 text-xl font-bold">{lockerLoading || lockerError ? "—" : availableLockers}</p></div>
              <div><p className="text-xs text-[#6a7d78]">Hủy ca chờ xử lý</p><p className="mt-1 text-xl font-bold text-[#b95a29]">{requestsLoading || requestsError ? "—" : requests.length}</p></div>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <RecentCheckins rows={checkins} now={now} loading={realtimeStatus === "connecting"} error={checkinError ?? (realtimeStatus === "offline" ? "Mất kết nối realtime. Các lượt mới sẽ hiển thị khi kết nối lại." : null)} />
              <UpcomingClasses schedules={schedules} now={now} loading={scheduleLoading} error={scheduleError} />
              <LockerAvailability lockers={lockers} loading={lockerLoading} error={lockerError} />
              <PendingCancellations requests={requests} loading={requestsLoading} error={requestsError} onOpen={setSelected} />
            </div>
          </div>
        </main>
      </div>
      {selected && <CancellationModal request={selected} onClose={closeModal} onReviewed={handleReviewed} onStale={() => void loadRequests()} />}
    </div>
  );
};
