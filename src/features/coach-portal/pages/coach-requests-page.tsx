import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';

export const CoachRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'PENALTIES'>('REQUESTS');

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Đơn Hủy Khẩn Cấp & Kỷ Luật
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến trình phê duyệt 2 tầng và hệ thống hỗ trợ ra quyết định kỷ luật (DSS - Mục 6.5)
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            void refetchRequests();
            void refetchPenalties();
          }}
          disabled={isReqLoading || isPenLoading || isReqRefetching || isPenRefetching}
          className="self-start sm:self-auto text-xs font-bold border-slate-200 bg-white shadow-xs"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isReqRefetching || isPenRefetching ? 'animate-spin' : ''
            }`}
          />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Policy Explainer Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 text-xs text-amber-950 shadow-xs">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Quy trình Hủy lịch khẩn cấp 2 Tầng (Mục 6.5):</p>
          <p className="text-[11px] leading-relaxed text-amber-900">
            • <strong>Tầng 1 (Gốc):</strong> Center Manager trực tiếp duyệt trên Web Dashboard.<br />
            • <strong>Tầng 2 (Dự phòng):</strong> Lễ tân trực quầy được quyền duyệt thay thế nếu Quản lý không online.<br />
            • <strong>Quyền lợi học viên:</strong> Bất kể thời điểm hủy, 100% học viên bị ảnh hưởng đều được tự động hoàn lại 01 lượt tập vô điều kiện.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'REQUESTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Đơn xin hủy khẩn cấp</span>
          <span className="rounded-full bg-slate-700 text-white px-2 py-0.2 text-[10px]">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENALTIES')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PENALTIES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Chế tài kỷ luật DSS</span>
          <span className="rounded-full bg-amber-700 text-white px-2 py-0.2 text-[10px]">
            {penalties.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Cancellation Requests */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
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
