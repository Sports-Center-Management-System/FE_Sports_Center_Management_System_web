import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Activity,
  Plus,
  RefreshCw,
  Target,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import { InbodyLogModal } from '../components/inbody-log-modal';
import type { AssignedMemberItem } from '../types/coach-portal.types';

export const CoachMembersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inbodyModalData, setInbodyModalData] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);

  const [selectedMember, setSelectedMember] = useState<AssignedMemberItem | null>(null);

  const selectedMemberId = selectedMember?.user?.id || selectedMember?.id;
  const { data: memberAttendances = [] } = useQuery({
    queryKey: ['coach', 'member-attendances', selectedMemberId],
    queryFn: () => coachPortalApi.getMemberAttendanceHistory(selectedMemberId!),
    enabled: Boolean(selectedMemberId),
  });

  const {
    data: members = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['coach', 'members', searchTerm],
    queryFn: () => coachPortalApi.getAssignedMembers(searchTerm.trim() || undefined),
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Học Viên Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách hội viên VIP được chỉ định kèm cặp, theo dõi thể trạng và đo InBody
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-auto text-xs font-bold border-slate-200 bg-white shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên học viên, số điện thoại hoặc email..."
          className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách học viên...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && members.length === 0 && (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
          <Users className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy học viên nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Không có học viên nào khớp với từ khóa tìm kiếm của bạn.'
              : 'Hiện tại bạn chưa được chỉ định học viên VIP nào. Khi hội viên mua gói VIP chọn bạn làm HLV, danh sách sẽ hiển thị tại đây.'}
          </p>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((item) => {
          const user = item?.user || ({} as any);
          const memberName = user.fullName || 'Học viên';
          const memberLogs = Array.isArray(user.memberInbodyLogs) ? user.memberInbodyLogs : [];
          const latestInbody = memberLogs[0];

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* User Info Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm uppercase overflow-hidden shrink-0 shadow-sm shadow-emerald-600/20">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={memberName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        memberName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {memberName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{user.phone || user.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    Gói Active
                  </span>
                </div>

                {/* Sub Quota Metrics */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Số buổi PT còn
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      {item.remainingPtSessions ?? 0} buổi
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hạn gói tập
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '--'}
                    </span>
                  </div>
                </div>

                {/* Fitness Goals */}
                {user.memberProfile?.fitnessGoals && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <Target className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      <strong className="text-slate-800">Mục tiêu:</strong>{' '}
                      {user.memberProfile.fitnessGoals}
                    </span>
                  </div>
                )}

                {/* Latest Inbody Snapshot */}
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 flex items-center gap-1.5 text-[11px]">
                      <Activity className="h-3.5 w-3.5 text-teal-600" />
                      Chỉ số InBody gần nhất
                    </span>
                    {latestInbody && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(latestInbody.measuredAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {latestInbody ? (
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                      <div className="bg-white rounded-lg p-1.5 border border-teal-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Cân nặng</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {latestInbody.weightKg} kg
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-1.5 border border-teal-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Lượng cơ</span>
                        <span className="font-extrabold text-teal-700 text-xs">
                          {latestInbody.muscleMassKg ? `${latestInbody.muscleMassKg} kg` : '--'}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-1.5 border border-teal-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Lượng mỡ</span>
                        <span className="font-extrabold text-rose-600 text-xs">
                          {latestInbody.bodyFatKg ? `${latestInbody.bodyFatKg} kg` : '--'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic py-1">
                      Học viên chưa có chỉ số InBody nào.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(item)}
                  className="flex-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Xem hồ sơ
                </Button>

                <Button
                  size="sm"
                  onClick={() =>
                    setInbodyModalData({
                      memberId: user.id || item.id,
                      memberName: memberName,
                    })
                  }
                  className="flex-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Đo InBody
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Drawer Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hồ sơ học viên: {selectedMember.user?.fullName || 'Học viên'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedMember.user?.phone || selectedMember.user?.email || 'Chưa cập nhật'}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Profile Details */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800 text-sm mb-1">Thông tin thể trạng</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Mục tiêu luyện tập:</span>
                    <span className="font-bold text-slate-900">
                      {selectedMember.user?.memberProfile?.fitnessGoals || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Chiều cao:</span>
                    <span className="font-bold text-slate-900">
                      {selectedMember.user?.memberProfile?.heightCm
                        ? `${selectedMember.user.memberProfile.heightCm} cm`
                        : 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Tiền sử chấn thương / bệnh lý:</span>
                    <span className="font-semibold text-rose-700">
                      {selectedMember.user?.memberProfile?.medicalHistory || 'Không có'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inbody Logs History Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Lịch sử đo InBody ({selectedMember.user?.memberInbodyLogs?.length || 0})
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => {
                      setInbodyModalData({
                        memberId: selectedMember.user?.id || selectedMember.id,
                        memberName: selectedMember.user?.fullName || 'Học viên',
                      });
                    }}
                    className="h-7 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Thêm lượt đo
                  </Button>
                </div>

                {Array.isArray(selectedMember.user?.memberInbodyLogs) && selectedMember.user.memberInbodyLogs.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ngày đo</th>
                          <th className="p-3">Cân nặng</th>
                          <th className="p-3">Lượng cơ</th>
                          <th className="p-3">Lượng mỡ</th>
                          <th className="p-3">Điểm InBody</th>
                          <th className="p-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedMember.user.memberInbodyLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-900 font-bold">
                              {new Date(log.measuredAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-3 text-slate-800 font-semibold">{log.weightKg} kg</td>
                            <td className="p-3 text-teal-700">
                              {log.muscleMassKg ? `${log.muscleMassKg} kg` : '--'}
                            </td>
                            <td className="p-3 text-rose-600">
                              {log.bodyFatKg ? `${log.bodyFatKg} kg` : '--'}
                            </td>
                            <td className="p-3 font-bold text-indigo-700">{log.score || '--'}</td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">
                              {log.notes || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Chưa có lịch sử đo InBody nào được ghi nhận.
                  </p>
                )}
              </div>

              {/* Attendance History Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Lịch sử tập luyện & Điểm danh ({memberAttendances.length})
                </h4>
                {memberAttendances.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Thời gian</th>
                          <th className="p-3">Loại ca</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3">Nhật ký / Nhận xét của HLV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {memberAttendances.slice(0, 10).map((att: any) => (
                          <tr key={att.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-900 font-semibold">
                              {new Date(att.checkInTime).toLocaleString('vi-VN')}
                            </td>
                            <td className="p-3 text-slate-700">
                              {att.checkinType === 'GATE_ENTRY' ? 'Vào cửa' : 'Buổi tập'}
                            </td>
                            <td className="p-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  att.status === 'PRESENT' || att.status === 'ATTENDED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {att.status === 'PRESENT' || att.status === 'ATTENDED'
                                  ? 'Có mặt'
                                  : 'Vắng mặt'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs truncate">
                              {att.notes || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    Chưa có lịch sử tham gia buổi tập nào được ghi nhận.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
                className="text-xs font-semibold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inbody Modal */}
      {inbodyModalData && (
        <InbodyLogModal
          memberId={inbodyModalData.memberId}
          memberName={inbodyModalData.memberName}
          isOpen={Boolean(inbodyModalData)}
          onClose={() => setInbodyModalData(null)}
        />
      )}
    </div>
  );
};
