import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Camera,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { coachPortalApi } from '../api/coach-portal-api';

export const CoachProfilePage: React.FC = () => {
  const location = useLocation();
  const coachBasePath = location.pathname.startsWith('/portal/coach') ? '/portal/coach' : '/coach';
  const { user: authUser, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState<string>(authUser?.fullName || '');
  const [phone, setPhone] = useState<string>(authUser?.phone || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Query
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['coach', 'profile'],
    queryFn: async () => {
      const data = await coachPortalApi.getMyProfile();
      if (data) {
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
      }
      return data;
    },
  });

  // Rates Query
  const {
    data: rates = [],
    isLoading: isRatesLoading,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ['coach', 'rates', authUser?.id],
    queryFn: () => {
      if (!authUser?.id) return [];
      return coachPortalApi.getMyRates(authUser.id);
    },
    enabled: Boolean(authUser?.id),
  });

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error('Vui lòng nhập họ và tên.');
      return coachPortalApi.updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
    },
    onSuccess: (updated) => {
      setSuccessMsg('Cập nhật thông tin thành công.');
      if (authUser) {
        setUser({ ...authUser, fullName: updated.fullName, phone: updated.phone });
      }
      queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật hồ sơ';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  // Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return coachPortalApi.uploadAvatar(file);
    },
    onSuccess: (res) => {
      setSuccessMsg('Cập nhật ảnh đại diện thành công.');
      if (authUser && res.avatarUrl) {
        setUser({ ...authUser, avatarUrl: res.avatarUrl });
      }
      queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tải ảnh đại diện';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  const handleRefresh = () => {
    void refetchProfile();
    void refetchRates();
  };

  const displayAvatar = profile?.avatarUrl || authUser?.avatarUrl;
  const displayName = profile?.fullName || authUser?.fullName || 'Huấn luyện viên';
  const displayEmail = profile?.email || authUser?.email || '';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* ========================================================= */}
      {/* CONTAINER 1: HEADER: Receptionist standard benchmark       */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`${coachBasePath}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008b74] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Lịch HLV
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
            Hồ sơ cá nhân
          </h1>
          <p className="text-xs text-white mt-0.5">
            Quản lý thông tin định danh, số điện thoại liên hệ và tra cứu các định mức biểu phí dạy kèm 1-1
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isProfileLoading || isRatesLoading}
            className="text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer h-9 px-3 rounded-xl shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isProfileLoading || isRatesLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#008b74] border border-emerald-200/70">
            Huấn luyện viên
          </span>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMsg && (
        <div className="w-full flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="w-full flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-900 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTAINER 2: AVATAR & IDENTITY BANNER                     */}
      {/* ========================================================= */}
      <div className="w-full rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-emerald-600 text-white font-black flex items-center justify-center text-3xl uppercase overflow-hidden shadow-sm">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                displayName.charAt(0)
              )}
            </div>

            <label className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-emerald-800 border-2 border-white transition-colors">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={avatarMutation.isPending}
              />
            </label>
          </div>

          {/* Coach Identity Information */}
          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayName}
              </h2>
              
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {displayEmail || 'Chưa cập nhật email'}
              </span>
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {phone}
                </span>
              )}
             
            </div>

            {avatarMutation.isPending && (
              <p className="text-xs text-emerald-600 flex items-center justify-center sm:justify-start gap-1.5 font-bold pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tải ảnh đại diện lên máy chủ...</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTAINER 3: THÔNG TIN CÁ NHÂN & LIÊN HỆ (1 LINE TRỌN VẸN) */}
      {/* ========================================================= */}
      <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Thông Tin Cá Nhân &amp; Liên Hệ</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật tên hiển thị và số điện thoại liên hệ trực tiếp cho học viên
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100">
              Họ và tên huấn luyện viên <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100">
              Số điện thoại liên hệ
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0987654321"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100">
              Địa chỉ Email tài khoản
            </label>
            <input
              type="email"
              value={displayEmail}
              disabled
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Địa chỉ email đăng nhập được quản lý bởi Quản trị viên (Admin).
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2 h-10 px-6 rounded-xl shadow-sm active:scale-[0.98] cursor-pointer"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Lưu thay đổi hồ sơ</span>
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTAINER 4: BIỂU PHÍ DẠY KÈM ĐƯỢC DUYỆT (1 LINE TRỌN VẸN) */}
      {/* ========================================================= */}
      <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Biểu Phí Dạy Kèm PT 1-1 Được Phê Duyệt</span>
            </h3>
            <p className="text-xs text-slate-500">
              Định mức thù lao dạy kèm theo buổi học được phê duyệt bởi Quản Lý Trung Tâm
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            Tổng cộng: {rates.length} biểu phí
          </span>
        </div>

        {isRatesLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Đang tải biểu phí dạy kèm...</p>
          </div>
        ) : rates.length === 0 ? (
          <div className="py-16 text-center space-y-2 p-8">
            <DollarSign className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Chưa có biểu phí nào được phê duyệt
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vui lòng liên hệ Quản lý trung tâm để cập nhật biểu phí buổi dạy cho chuyên môn của bạn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Bộ môn chuyên môn</th>
                  <th className="py-4 px-6">Mức phí mỗi buổi</th>
                  <th className="py-4 px-6">Ngày bắt đầu áp dụng</th>
                  <th className="py-4 px-6">Hạn hiệu lực</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">
                        {rate.discipline?.name || 'Huấn luyện viên PT'}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        {Number(rate.ratePerSession).toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">đ / buổi</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {new Date(rate.effectiveFrom).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {rate.effectiveTo
                        ? new Date(rate.effectiveTo).toLocaleDateString('vi-VN')
                        : 'Vô thời hạn'}
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="inline-block rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-3 py-1 text-xs font-bold">
                        Đang áp dụng
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
