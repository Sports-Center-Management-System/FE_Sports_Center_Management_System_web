import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Camera,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { coachPortalApi } from '../api/coach-portal-api';

export const CoachProfilePage: React.FC = () => {
  const { user: authUser, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState<string>(authUser?.fullName || '');
  const [phone, setPhone] = useState<string>(authUser?.phone || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Query
  const { data: profile } = useQuery({
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
  const { data: rates = [], isLoading: isRatesLoading } = useQuery({
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
      return coachPortalApi.updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
    },
    onSuccess: (updated) => {
      setSuccessMsg('Cập nhật thông tin thành công!');
      if (authUser) {
        setUser({ ...authUser, fullName: updated.fullName, phone: updated.phone });
      }
      queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật hồ sơ';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return coachPortalApi.uploadAvatar(file);
    },
    onSuccess: (res) => {
      setSuccessMsg('Cập nhật ảnh đại diện thành công!');
      if (authUser && res.avatarUrl) {
        setUser({ ...authUser, avatarUrl: res.avatarUrl });
      }
      queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tải ảnh đại diện';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Hồ Sơ Huấn Luyện Viên
        </h1>
        <p className="text-xs text-white mt-0.5">
          Quản lý thông tin cá nhân, chuyên môn và tra cứu biểu phí dạy kèm được duyệt
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-3xl uppercase overflow-hidden ring-4 ring-emerald-500/20 shadow-md">
              {profile?.avatarUrl || authUser?.avatarUrl ? (
                <img
                  src={profile?.avatarUrl || authUser?.avatarUrl || ''}
                  alt={profile?.fullName || authUser?.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile?.fullName?.charAt(0) || authUser?.fullName?.charAt(0) || 'C'
              )}
            </div>

            <label className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors">
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

          <div>
            <h3 className="text-base font-extrabold text-slate-900">{profile?.fullName}</h3>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <span className="inline-block mt-2 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
              Huấn Luyện Viên Chính Thức
            </span>
          </div>

          {avatarMutation.isPending && (
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải ảnh lên...
            </p>
          )}
        </div>

        {/* Right Column: Update Info Form */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Thông tin cá nhân</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0987654321"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email
              </label>
              <input
                type="email"
                value={profile?.email || authUser?.email || ''}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email tài khoản được quản lý bởi Quản trị viên (Admin).
              </span>
            </div>

            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm shadow-emerald-600/20"
            >
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Approved Coach Rates Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Biểu Phí Kèm Riêng PT Được Duyệt (Coach Rates)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Cấu hình bởi Center Manager (Mục 3.2 & 6.1a)
          </span>
        </div>

        {isRatesLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
          </div>
        ) : rates.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Chưa có biểu phí nào được phê duyệt cho bạn. Vui lòng liên hệ Center Manager để đăng ký mức phí buổi dạy.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Bộ môn</th>
                  <th className="p-3">Mức phí mỗi buổi (VND)</th>
                  <th className="p-3">Ngày bắt đầu áp dụng</th>
                  <th className="p-3">Ngày hết hiệu lực</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-900 font-extrabold">
                      {rate.discipline?.name || 'Chuyên môn'}
                    </td>
                    <td className="p-3 font-black text-emerald-700 text-sm">
                      {Number(rate.ratePerSession).toLocaleString('vi-VN')} đ / buổi
                    </td>
                    <td className="p-3 text-slate-600">
                      {new Date(rate.effectiveFrom).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-slate-600">
                      {rate.effectiveTo
                        ? new Date(rate.effectiveTo).toLocaleDateString('vi-VN')
                        : 'Vô thời hạn'}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
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
