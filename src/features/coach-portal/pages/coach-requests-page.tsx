import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCcw,
  Loader2,
  AlertCircle,
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
  } = useQuery({
    queryKey: ['coach', 'cancellation-requests'],
    queryFn: () => coachPortalApi.getMyCancellationRequests(),
  });

  const {
    data: penalties = [],
    isLoading: isPenLoading,
  } = useQuery({
    queryKey: ['coach', 'penalties'],
    queryFn: () => coachPortalApi.getMyPenalties(),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => coachPortalApi.withdrawCancellationRequest(id),
    onSuccess: async () => {
      setActionMessage({
        type: 'success',
        text: 'Đã rút lại yêu cầu hủy lịch thành công. Lịch dạy của bạn vẫn được bảo toàn nguyên vẹn.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
      ]);
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi rút lại yêu cầu hủy';
      const formatted =
        msg === 'CANNOT_CANCEL_NON_PENDING_REQUEST'
          ? 'Chỉ có thể rút yêu cầu khi đơn đang ở trạng thái Chờ duyệt.'
          : msg === 'REQUEST_ALREADY_REVIEWED'
          ? 'Yêu cầu này đã được Quản lý duyệt hoặc từ chối trước đó.'
          : typeof msg === 'string'
          ? msg
          : JSON.stringify(msg);
      setActionMessage({ type: 'error', text: formatted });
      setTimeout(() => setActionMessage(null), 5000);
    },
    onSettled: () => {
      setWithdrawingId(null);
    },
  });

  const handleWithdraw = (id: string) => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn rút lại yêu cầu hủy lịch này? Ca dạy / hẹn PT sẽ tiếp tục được giữ nguyên trạng thái CONFIRMED.'
      )
    ) {
      setWithdrawingId(id);
      withdrawMutation.mutate(id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
     

     

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`rounded-t-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'REQUESTS'
              ? 'bg-white shadow-xs'
              : 'text-white hover:bg-slate-100 hover:text-black'
          }`}
        >
          <span>Đơn xin hủy khẩn cấp</span>
          <span className="rounded-full bg-slate-700 text-white px-2 py-0.2 text-[10px]">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENALTIES')}
          className={`rounded-t-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PENALTIES'
              ? 'bg-white shadow-xs'
              : 'text-white hover:bg-slate-100 hover:text-black'
          }`}
        >
          <span>Chế tài kỷ luật</span>
          <span className="rounded-full bg-amber-700 text-white px-2 py-0.2 text-[10px]">
            {penalties.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Cancellation Requests */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          {actionMessage && (
            <div
              className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold animate-in fade-in duration-200 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {isReqLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách đơn hủy...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không có đơn hủy khẩn cấp nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bạn chưa từng nộp yêu cầu hủy lịch khẩn cấp nào. Tỷ lệ chuyên cần của bạn đang ở mức hoàn hảo!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          req.targetType === 'GROUP_CLASS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.targetType === 'GROUP_CLASS' ? 'LỚP NHÓM' : 'CA PT 1-1'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Gửi lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div>
                      {req.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                          <Clock className="h-3.5 w-3.5" />
                          Đang chờ duyệt
                        </span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã phê duyệt (Đã hoàn buổi cho học viên)
                        </span>
                      ) : req.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600">
                          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                          Đã rút yêu cầu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800">
                          <XCircle className="h-3.5 w-3.5" />
                          Bị từ chối
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Apology Reason Message */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lời nhắn xin lỗi gửi học viên:
                    </span>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{req.reasonMessage}"
                    </p>
                  </div>

                  {/* Internal Notes or Review Note */}
                  {(req.internalNote || req.reviewNote) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      {req.internalNote && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Ghi chú của bạn:
                          </span>
                          <p className="text-slate-600 mt-0.5">{req.internalNote}</p>
                        </div>
                      )}
                      {req.reviewNote && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Phản hồi từ Quản lý:
                          </span>
                          <p className="text-indigo-700 font-semibold mt-0.5">
                            {req.reviewNote}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action for Coach: Withdraw Pending Request */}
                  {req.status === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                      <p className="text-[11px] text-slate-500">
                        * Bạn có thể rút lại đơn trước khi Quản lý duyệt. Lịch dạy sẽ tiếp tục giữ nguyên.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(req.id)}
                        disabled={withdrawingId === req.id}
                        className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 gap-1.5 shadow-none self-end sm:self-auto"
                      >
                        {withdrawingId === req.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Rút yêu cầu hủy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Penalties & DSS */}
      {activeTab === 'PENALTIES' && (
        <div className="space-y-4">
          {isPenLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải lịch sử kỷ luật...</p>
            </div>
          ) : penalties.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <ShieldAlert className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không có bản ghi kỷ luật nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hệ thống DSS không ghi nhận bất kỳ cảnh báo hoặc vi phạm kỷ luật nào đối với bạn. Hãy tiếp tục duy trì!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {penalties.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Tháng ghi nhận: {item.month}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Số ca hủy khẩn cấp trong tháng: {item.cancellationCount} ca
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                        item.suggestedAction === 'NONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.suggestedAction === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.suggestedAction}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                    <p className="font-bold text-slate-700">Khuyến nghị xử lý của hệ thống:</p>
                    <p className="text-slate-600">
                      {item.suggestedAction === 'NONE' && 'Không áp dụng chế tài kỷ luật.'}
                      {item.suggestedAction === 'WARNING' && 'Cảnh cáo nhắc nhở do hủy lịch khẩn cấp.'}
                      {item.suggestedAction === 'SUGGEST_RATE_REDUCTION_15PCT' &&
                        'Đề xuất giảm 15% biểu phí dạy kèm do vượt ngưỡng hủy lịch.'}
                      {item.suggestedAction === 'TEMP_SUSPEND' &&
                        'Tạm đình chỉ mở slot rảnh mới trong 1 tuần.'}
                    </p>
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      * Quyết định cuối cùng do Center Manager trực tiếp xem xét tại kỳ họp giao ban cuối tháng.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
