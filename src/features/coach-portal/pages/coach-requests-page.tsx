import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  RefreshCw,
  RotateCcw,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';

export const CoachRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'PENALTIES'>('REQUESTS');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    data: requests = [],
    isLoading: isReqLoading,
    isRefetching: isReqRefetching,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['coach', 'cancellation-requests'],
    queryFn: () => coachPortalApi.getMyCancellationRequests(),
  });

  const {
    data: penalties = [],
    isLoading: isPenLoading,
    isRefetching: isPenRefetching,
    refetch: refetchPenalties,
  } = useQuery({
    queryKey: ['coach', 'penalties'],
    queryFn: () => coachPortalApi.getMyPenalties(),
  });

  const isCurrentLoading = activeTab === 'REQUESTS' ? isReqLoading : isPenLoading;
  const isCurrentRefetching = activeTab === 'REQUESTS' ? isReqRefetching : isPenRefetching;

  const handleRefetch = () => {
    if (activeTab === 'REQUESTS') void refetchRequests();
    else void refetchPenalties();
  };

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => coachPortalApi.withdrawCancellationRequest(id),
    onSuccess: async () => {
      setActionMessage({
        type: 'success',
        text: 'Đã rút lại yêu cầu hủy lịch thành công. Ca dạy vẫn được giữ nguyên.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
      ]);
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi rút lại yêu cầu';
      const formatted =
        msg === 'CANNOT_CANCEL_NON_PENDING_REQUEST'
          ? 'Chỉ có thể rút đơn khi đang ở trạng thái chờ duyệt.'
          : msg === 'REQUEST_ALREADY_REVIEWED'
          ? 'Yêu cầu này đã được quản lý xử lý trước đó.'
          : typeof msg === 'string'
          ? msg
          : JSON.stringify(msg);
      setActionMessage({ type: 'error', text: formatted });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onSettled: () => {
      setWithdrawingId(null);
    },
  });

  const handleWithdraw = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn rút lại đơn xin hủy lịch này không?')) {
      setWithdrawingId(id);
      withdrawMutation.mutate(id);
    }
  };

  const getSuggestedActionLabel = (action: string) => {
    switch (action) {
      case 'NONE':
        return 'Không áp dụng';
      case 'WARNING':
        return 'Cảnh cáo nhắc nhở';
      case 'SUGGEST_RATE_REDUCTION_15PCT':
        return 'Giảm 15% rate';
      case 'TEMP_SUSPEND':
        return 'Tạm đình chỉ mở ca';
      default:
        return action || 'Chưa xác định';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Kỷ Luật &amp; Yêu Cầu Hủy Ca</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Đơn Hủy &amp; Kỷ Luật
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Danh sách đơn xin hủy ca khẩn cấp và theo dõi lịch sử chế tài kỷ luật huấn luyện viên.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleRefetch}
          disabled={isCurrentLoading || isCurrentRefetching}
          className="self-start sm:self-auto text-xs font-bold border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 cursor-pointer h-10 px-4 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isCurrentRefetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* 2. Feedback Message */}
      {actionMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'REQUESTS'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <FileText className={`h-4 w-4 ${activeTab === 'REQUESTS' ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>Đơn xin hủy ca</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
              activeTab === 'REQUESTS'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PENALTIES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PENALTIES'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className={`h-4 w-4 ${activeTab === 'PENALTIES' ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>Chế tài kỷ luật</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
              activeTab === 'PENALTIES'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {penalties.length}
          </span>
        </button>
      </div>

      {/* 4. TAB 1: Cancellation Requests Table */}
      {activeTab === 'REQUESTS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isReqLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách đơn hủy...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-8">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Chưa có đơn xin hủy ca nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hiện tại bạn không có yêu cầu hủy ca khẩn cấp nào trong hệ thống.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Thời gian gửi</th>
                    <th className="py-4 px-4">Loại ca</th>
                    <th className="py-4 px-5">Lý do hủy gửi học viên</th>
                    <th className="py-4 px-4">Ghi chú phản hồi</th>
                    <th className="py-4 px-4 text-center">Trạng thái</th>
                    <th className="py-4 px-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {requests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isCancelled = req.status === 'CANCELLED';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {new Date(req.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · #{req.id.slice(0, 8)}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                              req.targetType === 'GROUP_CLASS'
                                ? 'bg-slate-950 text-white'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                            }`}
                          >
                            {req.targetType === 'GROUP_CLASS' ? 'Lớp nhóm' : 'Ca PT 1-1'}
                          </span>
                        </td>

                        <td className="py-4 px-5 max-w-sm">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                            {req.reasonMessage || '--'}
                          </p>
                          {req.internalNote && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Ghi chú nội bộ: {req.internalNote}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          {req.reviewNote ? (
                            <span className="text-slate-700 dark:text-slate-300 font-semibold block line-clamp-2">
                              {req.reviewNote}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <span className="inline-block px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 text-xs font-bold">
                              Chờ duyệt
                            </span>
                          ) : isApproved ? (
                            <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold">
                              Đã phê duyệt
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                              Đã rút đơn
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-xs font-bold">
                              Từ chối
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          {isPending ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdraw(req.id)}
                              disabled={withdrawingId === req.id}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 h-8 px-3 rounded-xl cursor-pointer"
                            >
                              {withdrawingId === req.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              )}
                              <span>Rút đơn</span>
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: Penalties Table */}
      {activeTab === 'PENALTIES' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isPenLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải lịch sử kỷ luật...</p>
            </div>
          ) : penalties.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-8">
              <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Không có bản ghi kỷ luật nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tỷ lệ chuyên cần tốt, chưa ghi nhận vi phạm kỷ luật nào.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Kỳ đánh giá</th>
                    <th className="py-4 px-4 text-center">Số ca hủy</th>
                    <th className="py-4 px-5">Chế tài áp dụng</th>
                    <th className="py-4 px-4 text-center">Trạng thái</th>
                    <th className="py-4 px-5 text-right">Ngày ghi nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {penalties.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          Tháng {item.month}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.cancellationCount} ca
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                            item.suggestedAction === 'NONE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                              : item.suggestedAction === 'WARNING'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800'
                          }`}
                        >
                          {getSuggestedActionLabel(item.suggestedAction)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.isReviewed
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.isReviewed ? 'Đã xem xét' : 'Đang xem xét'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap text-slate-500">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
