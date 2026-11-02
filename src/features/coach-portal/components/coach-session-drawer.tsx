import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Phone,
  FileText,
  UserCheck,
  CalendarClock,
  Sparkles,
  Dumbbell,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type { CoachScheduleSession } from '../types/coach-schedule.types';
import type { StudentBookingItem } from '../types/coach-portal.types';

interface CoachSessionDrawerProps {
  session: CoachScheduleSession | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckInStudent: (booking: StudentBookingItem, sessionStartTime: string, sessionEndTime?: string) => void;
  onOpenWorkoutPlan?: (booking: StudentBookingItem, sessionTitle: string) => void;
  onEmergencyCancel: (data: {
    scheduleId?: string;
    bookingId?: string;
    sessionTitle: string;
    sessionTime: string;
  }) => void;
  onSaveNotes?: (sessionId: string, notes: string) => void;
}

export const CoachSessionDrawer: React.FC<CoachSessionDrawerProps> = ({
  session,
  isOpen,
  onClose,
  onCheckInStudent,
  onOpenWorkoutPlan,
  onEmergencyCancel,
  onSaveNotes,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');

  // Check if there is an active pending cancellation request for this session
  const { data: cancellationRequests = [] } = useQuery({
    queryKey: ['coach', 'cancellation-requests'],
    queryFn: () => coachPortalApi.getMyCancellationRequests(),
    enabled: isOpen && Boolean(session),
  });

  // Synchronize notes when session opens
  React.useEffect(() => {
    if (session) {
      setNotesContent(session.notes || '');
      setIsEditingNotes(false);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const isCompleted = session.status === 'COMPLETED';
  const isPt = session.type === 'PT';
  const isEmptySlot = session.type === 'EMPTY_SLOT' || session.isSlotEmpty;

  const formatTimeRange = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const sStr = s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const eStr = e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const durationMin = Math.round((e.getTime() - s.getTime()) / 60000);
      return {
        label: `${sStr} – ${eStr}`,
        duration: `${durationMin} phút`,
        dateStr: s.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      };
    } catch {
      return { label: '', duration: '', dateStr: '' };
    }
  };

  const timeInfo = formatTimeRange(session.startTime, session.endTime);

  const primaryTitle = isEmptySlot
    ? 'Slot trống (Chưa có học viên)'
    : isPt
    ? session.studentName || 'Học viên PT'
    : session.title || 'Lớp tập nhóm';

  // Find primary booking for PT
  const primaryBooking = session.bookings?.[0];

  const sessionPendingRequest = cancellationRequests.find((r) => {
    if (r.status !== 'PENDING') return false;
    if (session.scheduleId && r.scheduleId === session.scheduleId) return true;
    if (primaryBooking?.id && r.bookingId === primaryBooking.id) return true;
    return false;
  });

  const handleSaveNotes = () => {
    if (onSaveNotes) {
      onSaveNotes(session.id, notesContent);
    }
    setIsEditingNotes(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full sm:max-w-md h-full bg-white dark:bg-[#131b26] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250 border-l border-slate-200/80 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            {isPt ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                Huấn luyện PT 1:1
              </span>
            ) : isEmptySlot ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700">
                Slot trống
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                Lớp tập nhóm
              </span>
            )}

            {sessionPendingRequest ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                Đang xin nghỉ (Chờ duyệt)
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Đã hoàn thành
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                Sắp diễn ra
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng bảng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Title & Student / Class Hero */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {primaryTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 capitalize">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {timeInfo.dateStr}
            </p>
          </div>

          {/* Ô BÁO: Hiện bạn đang xin nghỉ ca này (Nếu có pending request) */}
          {sessionPendingRequest && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-700/80 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Hiện bạn đang xin nghỉ ca này</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                  Chờ duyệt
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 italic leading-relaxed">
                "{sessionPendingRequest.reasonMessage}"
              </p>
            </div>
          )}

          {/* Time & Room Details Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {timeInfo.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Thời lượng {timeInfo.duration}
                  </div>
                </div>
              </div>
            </div>

            {session.roomName && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{session.roomName}</span>
              </div>
            )}
          </div>

          {/* Student Info (for PT) or Roster (for Group Class) */}
          {isPt && !isEmptySlot && (
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-[#131b26]">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Thông tin học viên</span>
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded">
                  Học viên 1-1
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-base">
                  {session.studentName ? session.studentName.charAt(0).toUpperCase() : 'HV'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {session.studentName}
                  </div>
                  {session.studentPhone && (
                    <a
                      href={`tel:${session.studentPhone}`}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      {session.studentPhone}
                    </a>
                  )}
                </div>
              </div>

              {primaryBooking?.member?.memberProfile?.fitnessGoals && (
                <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-2.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Mục tiêu tập luyện:{' '}
                  </span>
                  {primaryBooking.member.memberProfile.fitnessGoals}
                </div>
              )}
            </div>
          )}

          {/* Group Class Roster */}
          {!isPt && !isEmptySlot && (
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-[#131b26]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Danh sách học viên ({session.enrolledCount || 0}/{session.capacity || 12})
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((session.enrolledCount || 0) / (session.capacity || 12)) * 100)
                    )}%`,
                  }}
                />
              </div>

              {/* Student list */}
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {(session.bookings || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có danh sách chi tiết.</p>
                ) : (
                  (session.bookings || []).map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {b.member?.fullName || `Học viên ${idx + 1}`}
                          </div>
                          {b.member?.phone && (
                            <div className="text-[11px] text-slate-400">{b.member.phone}</div>
                          )}
                        </div>
                      </div>

                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCheckInStudent(b, session.startTime, session.endTime)}
                          className="h-7 px-2.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Điểm danh
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Empty slot message */}
          {isEmptySlot && (
            <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Khung giờ đang mở nhận hội viên
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                Slot này hiện chưa có học viên đặt chỗ. Hội viên có thể đăng ký trực tuyến qua app hội viên hoặc bạn có thể chỉ định học viên trực tiếp.
              </p>
            </div>
          )}

          {/* Session Notes Section */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-[#131b26]">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Ghi chú buổi tập
              </div>

              {!isCompleted && !isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {session.notes ? 'Chỉnh sửa' : '+ Thêm ghi chú'}
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Nhập giáo án, lưu ý thể lực hoặc dặn dò học viên..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-h-[90px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingNotes(false)}
                    className="text-xs h-7 px-3"
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    className="text-xs h-7 px-3 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Lưu ghi chú
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg">
                {session.notes || 'Chưa có ghi chú nào cho buổi tập này.'}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col gap-2">
          {isCompleted ? (
            /* Ca đã hoàn thành chỉ xem ghi chú */
            <div className="flex items-center justify-between text-xs text-slate-500 py-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ca dạy đã kết thúc & lưu hồ sơ
              </span>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Đóng
              </Button>
            </div>
          ) : isEmptySlot ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 text-xs font-semibold"
              >
                Đóng
              </Button>
            </div>
          ) : (
            /* Ca sắp diễn ra / chưa hoàn thành: Điểm danh / Đổi lịch / Ghi chú / Hủy */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Điểm danh */}
                {isPt && primaryBooking && (
                  <Button
                    onClick={() => {
                      onCheckInStudent(primaryBooking, session.startTime, session.endTime);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                    Điểm danh
                  </Button>
                )}

                {/* Giáo án PT (M14.1) */}
                {isPt && primaryBooking && onOpenWorkoutPlan && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenWorkoutPlan(primaryBooking, primaryTitle);
                    }}
                    className="text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-2xs"
                  >
                    <Dumbbell className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    Giáo án PT
                  </Button>
                )}

                {/* Đổi lịch (hoặc hiển thị nếu không có primaryBooking) */}
                {(!isPt || !primaryBooking || !onOpenWorkoutPlan) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      alert('Chức năng đổi lịch sẽ gửi yêu cầu xác nhận tới học viên.');
                    }}
                    className="text-xs font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <CalendarClock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Đổi lịch
                  </Button>
                )}
              </div>

              {/* Hủy ca khẩn cấp hoặc Xem/Hủy yêu cầu xin nghỉ */}
              {sessionPendingRequest ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEmergencyCancel({
                      scheduleId: session.scheduleId,
                      bookingId: primaryBooking?.id,
                      sessionTitle: primaryTitle,
                      sessionTime: timeInfo.label,
                    });
                  }}
                  className="w-full text-xs border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200 font-bold gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đang xin nghỉ • Bấm để xem / hủy yêu cầu</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEmergencyCancel({
                      scheduleId: session.scheduleId,
                      bookingId: primaryBooking?.id,
                      sessionTitle: primaryTitle,
                      sessionTime: timeInfo.label,
                    });
                  }}
                  className="w-full text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                  Hủy ca dạy (Báo bận đột xuất)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
