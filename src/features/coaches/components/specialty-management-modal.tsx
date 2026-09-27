import React, { useState } from "react";
import { Specialty, CreateSpecialtyPayload, UpdateSpecialtyPayload } from "../types";
import { Button } from "@/components/ui/button";
import { X, Plus, Edit2, Trash2, AlertTriangle, ShieldCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpecialtyManagementModalProps {
  open: boolean;
  onClose: () => void;
  specialties: Specialty[];
  onCreateSpecialty: (payload: CreateSpecialtyPayload) => void;
  onUpdateSpecialty: (payload: UpdateSpecialtyPayload) => void;
  onDeleteSpecialty: (id: string) => void;
}

export const SpecialtyManagementModal: React.FC<SpecialtyManagementModalProps> = ({
  open,
  onClose,
  specialties,
  onCreateSpecialty,
  onUpdateSpecialty,
  onDeleteSpecialty,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  // Create form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Restrict warning state
  const [restrictWarning, setRestrictWarning] = useState<string | null>(null);

  if (!open) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingSpecialty(null);
    setCode("");
    setName("");
    setDescription("");
    setRestrictWarning(null);
  };

  const handleStartEdit = (spc: Specialty) => {
    setEditingSpecialty(spc);
    setIsCreating(false);
    setEditName(spc.name);
    setEditDescription(spc.description);
    setRestrictWarning(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onCreateSpecialty({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
    });

    setIsCreating(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialty || !editName.trim()) return;

    onUpdateSpecialty({
      id: editingSpecialty.id,
      name: editName.trim(),
      description: editDescription.trim(),
    });

    setEditingSpecialty(null);
  };

  const handleDelete = (spc: Specialty) => {
    // RESTRICT CHECK: Cannot delete if coaches are currently assigned
    if (spc.assignedCoachesCount > 0) {
      setRestrictWarning(
        `Ràng buộc toàn vẹn dữ liệu (RESTRICT): Không thể xóa chuyên môn "${spc.name}" vì đang có ${spc.assignedCoachesCount} Huấn luyện viên phụ trách. Vui lòng gỡ chuyên môn khỏi danh sách HLV trước!`
      );
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa chuyên môn "${spc.name}"?`)) {
      onDeleteSpecialty(spc.id);
      setRestrictWarning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quản Lý Danh Mục Chuyên Môn
              </h3>
              <p className="text-xs text-slate-500">
                Thêm, sửa và kiểm soát điều kiện ràng buộc RESTRICT khi xóa bộ môn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* RESTRICT Warning Banner */}
        {restrictWarning && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Cảnh báo vi phạm ràng buộc (RESTRICT)</p>
              <p className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                {restrictWarning}
              </p>
            </div>
            <button
              onClick={() => setRestrictWarning(null)}
              className="text-rose-400 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
            Danh sách chuyên môn ({specialties.length})
          </span>
          {!isCreating && (
            <Button
              variant="mint"
              size="sm"
              onClick={handleStartCreate}
              className="rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm chuyên môn mới (POST)
            </Button>
          )}
        </div>

        {/* Create Form (POST) */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="mt-3 rounded-xl border border-[#008b74]/30 bg-[#f0f9f6]/40 p-4 space-y-3 animate-in fade-in-50"
          >
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-bold text-[#008b74]">Tạo chuyên môn mới (POST)</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Mã chuyên môn (Code)</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: PILATES, TENNIS"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold uppercase text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700">Tên chuyên môn</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Pilates Reformer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700">Mô tả chuyên môn</label>
              <textarea
                rows={2}
                placeholder="Mô tả nội dung chương trình giảng dạy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button type="submit" variant="mint" size="sm" className="text-xs font-bold">
                Lưu chuyên môn
              </Button>
            </div>
          </form>
        )}

        {/* Edit Form (PUT) */}
        {editingSpecialty && (
          <form
            onSubmit={handleEditSubmit}
            className="mt-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3 animate-in fade-in-50"
          >
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-800">Chỉnh sửa chuyên môn (PUT)</span>
                <span className="font-mono text-[10px] font-bold text-sky-600 bg-white px-1.5 py-0.5 rounded border border-sky-200">
                  {editingSpecialty.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSpecialty(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700">Tên chuyên môn</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700">Mô tả chuyên môn</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingSpecialty(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button type="submit" variant="mint" size="sm" className="text-xs font-bold">
                Cập nhật (PUT)
              </Button>
            </div>
          </form>
        )}

        {/* List of Specialties Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Mã & Bộ Môn</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3 text-center">HLV phụ trách</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {specialties.map((spc) => {
                const hasCoaches = spc.assignedCoachesCount > 0;
                return (
                  <tr key={spc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 align-top">
                      <div className="font-bold text-slate-900">{spc.name}</div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded mt-1 inline-block">
                        {spc.code}
                      </span>
                    </td>
                    <td className="p-3 align-top text-slate-500 max-w-xs text-[11px] leading-relaxed">
                      {spc.description}
                    </td>
                    <td className="p-3 align-top text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold font-mono",
                          hasCoaches
                            ? "bg-[#e6f7f2] text-[#008b74]"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {spc.assignedCoachesCount} HLV
                      </span>
                    </td>
                    <td className="p-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(spc)}
                          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          title="Sửa chuyên môn (PUT)"
                        >
                          <Edit2 className="h-3 w-3 text-slate-400" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(spc)}
                          className={cn(
                            "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors",
                            hasCoaches
                              ? "text-slate-400 hover:bg-slate-100 cursor-not-allowed"
                              : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          )}
                          title={
                            hasCoaches
                              ? "Đang có HLV phụ trách (Ràng buộc RESTRICT)"
                              : "Xóa chuyên môn (DELETE)"
                          }
                        >
                          <Trash2 className="h-3 w-3" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span>* Ràng buộc RESTRICT bảo vệ tính toàn vẹn dữ liệu các lớp học và phân công HLV.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
