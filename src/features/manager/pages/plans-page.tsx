import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { money } from '@/lib/api'
import { managerApi, managerKeys } from '../api/manager-api'
import type { Discipline, MembershipPlan, PackageTier, PlanPayload, PlanType, TrainingMode } from '../types/manager.types'
import { errorMessage, tierLabel, trainingModeLabel } from '../lib/format'
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
  Td,
  TextArea,
  TextInput,
  Th,
} from '../components/manager-ui'

const tiers: PackageTier[] = ['TRIAL', 'DROP_IN', 'PLUS', 'VIP']
const modes: TrainingMode[] = ['GROUP_CLASS', 'PERSONAL_TRAINING', 'HYBRID', 'CUSTOM']

/** Mirrors MembershipsService.validate so mistakes show before the request. */
function planProblem(form: PlanPayload, discipline?: Discipline): string | null {
  const isGym = discipline?.code.toUpperCase() === 'GYM'
  if (isGym && (form.trainingMode === 'GROUP_CLASS' || form.groupSessionQuota !== 0))
    return 'Gói Gym không được là lớp nhóm và phải có 0 buổi nhóm.'
  if (form.unlimitedGymEntry && !isGym) return 'Chỉ gói Gym mới được vào cửa không giới hạn.'
  if (form.packageTier === 'VIP' && form.ptSessionQuota !== 12) return 'Gói VIP phải có đúng 12 buổi PT.'
  if (form.packageTier === 'TRIAL' && (form.price !== 0 || form.ptSessionQuota !== 0))
    return 'Gói Trial phải có giá 0 và 0 buổi PT.'
  return null
}

export function ManagerPlansPage() {
  const queryClient = useQueryClient()
  const plans = useQuery({ queryKey: managerKeys.plans, queryFn: managerApi.plans })
  const disciplines = useQuery({ queryKey: managerKeys.disciplines, queryFn: managerApi.disciplines })
  const [disciplineFilter, setDisciplineFilter] = useState('')
  const [editing, setEditing] = useState<MembershipPlan | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const disable = useMutation({
    mutationFn: (id: string) => managerApi.disablePlan(id),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: managerKeys.plans })
    },
    onError: (err) => setError(errorMessage(err)),
  })
  const rows = (plans.data ?? []).filter((plan) => !disciplineFilter || plan.disciplineId === disciplineFilter)

  return (
    <>
      <PageHeader
        title="Gói tập"
        description="Các gói đang bán. Ngừng bán không ảnh hưởng hợp đồng hội viên đã mua."
        actions={
          <Btn tone="primary" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Tạo gói
          </Btn>
        }
      />
      <Panel
        title={`${rows.length} gói đang bán`}
        actions={
          <SelectInput
            aria-label="Lọc theo môn"
            className="h-8 w-48 py-1"
            value={disciplineFilter}
            onChange={(event) => setDisciplineFilter(event.target.value)}
          >
            <option value="">Tất cả môn</option>
            {(disciplines.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectInput>
        }
      >
        <FormError inset>{error}</FormError>
        {plans.isLoading || plans.isError ? (
          <StateMessage
            loading={plans.isLoading}
            error={plans.isError ? errorMessage(plans.error) : null}
            onRetry={() => void plans.refetch()}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Gói</Th>
                <Th>Môn</Th>
                <Th>Hạng</Th>
                <Th>Hình thức</Th>
                <Th className="text-right">Giá</Th>
                <Th>Thời hạn</Th>
                <Th>Buổi nhóm / PT</Th>
                <Th className="text-right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={8}>Chưa có gói nào.</EmptyRow>
              ) : (
                rows.map((plan) => (
                  <tr key={plan.id}>
                    <Td>
                      <div className="font-medium text-slate-900">{plan.name}</div>
                      {plan.unlimitedGymEntry ? (
                        <div className="text-xs text-slate-400">Vào cửa không giới hạn</div>
                      ) : null}
                    </Td>
                    <Td>{plan.discipline?.name ?? '—'}</Td>
                    <Td>
                      <Pill tone={plan.packageTier === 'VIP' ? 'amber' : 'gray'}>{tierLabel[plan.packageTier]}</Pill>
                    </Td>
                    <Td>{trainingModeLabel[plan.trainingMode]}</Td>
                    <Td className="text-right tabular-nums">{money(plan.price)}</Td>
                    <Td className="tabular-nums">{plan.durationDays} ngày</Td>
                    <Td className="tabular-nums">
                      {plan.groupSessionQuota ?? 0} / {plan.ptSessionQuota ?? 0}
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Btn size="sm" tone="ghost" onClick={() => setEditing(plan)}>
                        Sửa
                      </Btn>
                      <Btn
                        size="sm"
                        tone="danger"
                        disabled={disable.isPending}
                        onClick={() => window.confirm(`Ngừng bán gói ${plan.name}?`) && disable.mutate(plan.id)}
                      >
                        Ngừng bán
                      </Btn>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Panel>
      {editing ? (
        <PlanForm
          plan={editing === 'new' ? null : editing}
          disciplines={disciplines.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.plans })
          }}
        />
      ) : null}
    </>
  )
}

function PlanForm({
  plan,
  disciplines,
  onClose,
  onSaved,
}: {
  plan: MembershipPlan | null
  disciplines: Discipline[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    disciplineId: plan?.disciplineId ?? disciplines[0]?.id ?? '',
    name: plan?.name ?? '',
    description: plan?.description ?? '',
    price: plan ? String(Number(plan.price)) : '',
    durationDays: String(plan?.durationDays ?? 30),
    packageTier: plan?.packageTier ?? ('PLUS' as PackageTier),
    trainingMode: plan?.trainingMode ?? ('GROUP_CLASS' as TrainingMode),
    planType: plan?.planType ?? ('GENERAL' as PlanType),
    groupSessionQuota: String(plan?.groupSessionQuota ?? 0),
    ptSessionQuota: String(plan?.ptSessionQuota ?? 0),
    unlimitedGymEntry: plan?.unlimitedGymEntry ?? false,
  })
  const [error, setError] = useState<string | null>(null)
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const discipline = disciplines.find((d) => d.id === form.disciplineId)
  const isGym = discipline?.code.toUpperCase() === 'GYM'

  const payload = (): PlanPayload => ({
    disciplineId: form.disciplineId,
    name: form.name.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    price: Number(form.price),
    durationDays: Number(form.durationDays),
    packageTier: form.packageTier,
    trainingMode: form.trainingMode,
    planType: form.planType,
    groupSessionQuota: isGym ? 0 : Number(form.groupSessionQuota),
    ptSessionQuota: Number(form.ptSessionQuota),
    unlimitedGymEntry: isGym && form.unlimitedGymEntry,
  })
  const save = useMutation({
    mutationFn: () => {
      // Discipline and tier inputs are locked on edit; the API accepts them when unchanged.
      const body = payload()
      return plan ? managerApi.updatePlan(plan.id, body) : managerApi.createPlan(body)
    },
    onSuccess: onSaved,
    onError: (err) => setError(errorMessage(err)),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = planProblem(payload(), discipline)
    if (problem) return setError(problem)
    setError(null)
    save.mutate()
  }

  return (
    <Modal
      wide
      title={plan ? `Sửa gói ${plan.name}` : 'Tạo gói tập'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="plan-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : plan ? 'Lưu thay đổi' : 'Tạo gói'}
          </Btn>
        </>
      }
    >
      <form id="plan-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên gói" className="sm:col-span-2">
          <TextInput required minLength={2} maxLength={100} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Môn" hint={plan ? 'Không đổi được sau khi tạo.' : undefined}>
          <SelectInput disabled={!!plan} value={form.disciplineId} onChange={set('disciplineId')}>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Hạng" hint={plan ? 'Không đổi được sau khi tạo.' : undefined}>
          <SelectInput disabled={!!plan} value={form.packageTier} onChange={set('packageTier')}>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tierLabel[tier]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Hình thức tập">
          <SelectInput value={form.trainingMode} onChange={set('trainingMode')}>
            {modes.map((mode) => (
              <option key={mode} value={mode} disabled={isGym && mode === 'GROUP_CLASS'}>
                {trainingModeLabel[mode]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Loại gói">
          <SelectInput value={form.planType} onChange={set('planType')}>
            <option value="GENERAL">Thông thường</option>
            <option value="PERSONAL_TRAINING">Huấn luyện cá nhân</option>
          </SelectInput>
        </Field>
        <Field label="Giá (VND)">
          <TextInput type="number" required min={0} step={1000} value={form.price} onChange={set('price')} />
        </Field>
        <Field label="Thời hạn (ngày)">
          <TextInput type="number" required min={1} max={3650} value={form.durationDays} onChange={set('durationDays')} />
        </Field>
        <Field label="Số buổi lớp nhóm" hint={isGym ? 'Gym luôn là 0.' : undefined}>
          <TextInput
            type="number"
            required
            min={0}
            disabled={isGym}
            value={isGym ? '0' : form.groupSessionQuota}
            onChange={set('groupSessionQuota')}
          />
        </Field>
        <Field label="Số buổi PT" hint={form.packageTier === 'VIP' ? 'VIP phải là 12.' : undefined}>
          <TextInput type="number" required min={0} value={form.ptSessionQuota} onChange={set('ptSessionQuota')} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#008b74]"
            disabled={!isGym}
            checked={isGym && form.unlimitedGymEntry}
            onChange={(event) => setForm((current) => ({ ...current, unlimitedGymEntry: event.target.checked }))}
          />
          Vào cửa không giới hạn {isGym ? '' : '(chỉ áp dụng cho Gym)'}
        </label>
        <Field label="Mô tả" className="sm:col-span-2">
          <TextArea maxLength={5000} value={form.description} onChange={set('description')} />
        </Field>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
        </div>
      </form>
    </Modal>
  )
}
