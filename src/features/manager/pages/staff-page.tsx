import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { managerApi, managerKeys } from '../api/manager-api'
import type { StaffRole, UserRow } from '../types/manager.types'
import { errorMessage, formatDate, roleLabel } from '../lib/format'
import {
  Btn,
  EmptyRow,
  Field,
  FormError,
  Modal,
  PageHeader,
  Panel,
  Pill,
  SelectInput,
  StateMessage,
  Table,
  Tabs,
  Td,
  TextInput,
  Th,
  Pagination,
} from '../components/manager-ui'
import { usePagination } from '../lib/use-pagination'

type Filter = 'ALL' | StaffRole

export function ManagerStaffPage() {
  const queryClient = useQueryClient()
  const staff = useQuery({ queryKey: managerKeys.staff, queryFn: managerApi.staff })
  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<UserRow | 'new' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const toggle = useMutation({
    mutationFn: (user: UserRow) =>
      user.isActive
        ? managerApi.disableStaff(user.id)
        : managerApi.updateStaff(user.id, { isActive: true }),
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: managerKeys.staff })
    },
    onError: (error) => setActionError(errorMessage(error)),
  })

  const rows = staff.data ?? []
  const term = search.trim().toLowerCase()
  const visible = rows.filter(
    (user) =>
      (filter === 'ALL' || user.role === filter) &&
      (!term ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone ?? '').includes(term)),
  )

  const { items: pageRows, pager } = usePagination(visible, 10, `${filter}|${term}`)

  return (
    <div className="rounded-md bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <PageHeader
        title="Nhân sự"
        description="Tài khoản lễ tân và huấn luyện viên của trung tâm."
        actions={
          <Btn tone="primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </Btn>
        }
      />
      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'ALL', label: 'Tất cả', count: rows.length },
          {
            value: 'RECEPTIONIST',
            label: 'Lễ tân',
            count: rows.filter((u) => u.role === 'RECEPTIONIST').length,
          },
          {
            value: 'COACH',
            label: 'Huấn luyện viên',
            count: rows.filter((u) => u.role === 'COACH').length,
          },
        ]}
      />
      <Panel
        title={`${visible.length} nhân viên`}
        actions={
          <TextInput
            type="search"
            aria-label="Tìm nhân viên"
            placeholder="Tìm theo tên, email, SĐT"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-64 py-1"
          />
        }
      >
        <FormError inset>{actionError}</FormError>
        {staff.isLoading || staff.isError ? (
          <StateMessage
            loading={staff.isLoading}
            error={staff.isError ? errorMessage(staff.error) : null}
            onRetry={() => void staff.refetch()}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Họ tên</Th>
                  <Th>Vai trò</Th>
                  <Th>Liên hệ</Th>
                  <Th>Ngày tạo</Th>
                  <Th>Trạng thái</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <EmptyRow colSpan={6}>Không có nhân viên phù hợp.</EmptyRow>
                ) : (
                  pageRows.map((user) => (
                    <tr key={user.id}>
                      <Td className="font-medium text-slate-900">{user.fullName}</Td>
                      <Td>{roleLabel[user.role]}</Td>
                      <Td>
                        <div>{user.email}</div>
                        <div className="text-xs text-slate-400">{user.phone}</div>
                      </Td>
                      <Td>{formatDate(user.createdAt)}</Td>
                      <Td>
                        {user.isActive ? <Pill tone="green">Đang làm</Pill> : <Pill>Đã khóa</Pill>}
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        <Btn size="sm" tone="ghost" onClick={() => setEditing(user)}>
                          Sửa
                        </Btn>
                        <Btn
                          size="sm"
                          tone={user.isActive ? 'danger' : 'secondary'}
                          disabled={toggle.isPending}
                          onClick={() => {
                            if (
                              !user.isActive ||
                              window.confirm(
                                `Khóa tài khoản ${user.fullName}? Người này sẽ bị đăng xuất ngay.`,
                              )
                            )
                              toggle.mutate(user)
                          }}
                        >
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </Btn>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            <Pagination pager={pager} />
          </>
        )}
      </Panel>
      {editing ? (
        <StaffForm
          user={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.staff })
          }}
        />
      ) : null}
    </div>
  )
}

function StaffForm({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: (user?.role === 'COACH' ? 'COACH' : 'RECEPTIONIST') as StaffRole,
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () =>
      user
        ? managerApi.updateStaff(user.id, {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            ...(form.password ? { password: form.password } : {}),
          })
        : managerApi.createStaff({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: form.role,
            password: form.password,
          }),
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if ((!user || form.password) && form.password.length < 8)
      return setError('Mật khẩu cần ít nhất 8 ký tự.')
    setError(null)
    save.mutate()
  }

  return (
    <Modal
      title={user ? `Sửa ${user.fullName}` : 'Thêm nhân viên'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="staff-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : user ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </Btn>
        </>
      }
    >
      <form id="staff-form" onSubmit={submit} className="space-y-3">
        <Field label="Họ tên">
          <TextInput required maxLength={150} value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Email" hint={user ? 'Email không đổi được.' : undefined}>
          <TextInput
            type="email"
            required
            disabled={!!user}
            value={form.email}
            onChange={set('email')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số điện thoại">
            <TextInput required maxLength={20} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Vai trò">
            <SelectInput disabled={!!user} value={form.role} onChange={set('role')}>
              <option value="RECEPTIONIST">Lễ tân</option>
              <option value="COACH">Huấn luyện viên</option>
            </SelectInput>
          </Field>
        </div>
        <Field
          label={user ? 'Mật khẩu mới' : 'Mật khẩu'}
          hint={user ? 'Để trống nếu không đổi. Ít nhất 8 ký tự.' : 'Ít nhất 8 ký tự.'}
        >
          <TextInput
            type="password"
            autoComplete="new-password"
            required={!user}
            value={form.password}
            onChange={set('password')}
          />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}
