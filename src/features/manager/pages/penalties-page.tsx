import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, managerKeys } from '../api/manager-api'
import type { CancellationRequest, CoachPenalty } from '../types/manager.types'
import { cancellationStatusLabel, errorMessage, formatDateTime } from '../lib/format'
import {
  Btn,
  EmptyRow,
  Field,
  FormError,
  Modal,
  PageHeader,
  Panel,
  Pill,
  StateMessage,
  Table,
  Tabs,
  Td,
  TextArea,
  Th,
  Pagination,
} from '../components/manager-ui'
import { usePagination } from '../lib/use-pagination'

type Tab = 'pending' | 'history' | 'penalties'

const statusTone = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
} as const
const actionLabel: Record<string, string> = {
  NONE: 'Không xử lý',
  WARNING: 'Nhắc nhở',
  SUGGEST_RATE_REDUCTION_15PCT: 'Đề xuất giảm 15% biểu phí',
  TEMP_SUSPEND: 'Tạm đình chỉ',
}

export function ManagerPenaltiesPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('pending')
  const requests = useQuery({
    queryKey: managerKeys.cancellations,
    queryFn: managerApi.cancellations,
  })
  const penalties = useQuery({ queryKey: managerKeys.penalties, queryFn: managerApi.penalties })
  const staff = useQuery({ queryKey: managerKeys.staff, queryFn: managerApi.staff })
  const schedules = useQuery({ queryKey: managerKeys.schedules, queryFn: managerApi.schedules })
  const [rejecting, setRejecting] = useState<CancellationRequest | null>(null)
  const [detailItem, setDetailItem] = useState<CancellationRequest | null>(null)
  const [reviewing, setReviewing] = useState<CoachPenalty | null>(null)
  const [error, setError] = useState<string | null>(null)

  const coachName = (id: string) => staff.data?.find((user) => user.id === id)?.fullName ?? 'HLV'
  const scheduleById = new Map((schedules.data ?? []).map((s) => [s.id, s]))
  const all = requests.data ?? []
  const pending = all.filter((item) => item.status === 'PENDING')
  const history = all.filter((item) => item.status !== 'PENDING')
  const penaltyRows = penalties.data ?? []
  const openPenalties = penaltyRows.filter((p) => !p.isReviewedByManager).length
  const pendingPage = usePagination(pending, 10)
  const historyPage = usePagination(history, 10)
  const penaltyPage = usePagination(penaltyRows, 10)

  const refreshRequests = () => {
    void queryClient.invalidateQueries({ queryKey: managerKeys.cancellations })
    void queryClient.invalidateQueries({ queryKey: managerKeys.summary })
    void queryClient.invalidateQueries({ queryKey: managerKeys.penalties })
  }
  const approve = useMutation({
    mutationFn: (id: string) => managerApi.reviewCancellation(id, { action: 'APPROVE' }),
    onSuccess: () => {
      setError(null)
      refreshRequests()
    },
    onError: (err) => {
      setError(errorMessage(err))
      refreshRequests()
    },
  })
  const withdraw = useMutation({
    mutationFn: (id: string) => managerApi.withdrawCancellation(id),
    onSuccess: () => {
      setError(null)
      refreshRequests()
    },
    onError: (err) => {
      setError(errorMessage(err))
      refreshRequests()
    },
  })

  const target = (item: CancellationRequest) => {
    const schedule = item.scheduleId ? scheduleById.get(item.scheduleId) : undefined
    if (item.targetType === 'GROUP_CLASS')
      return schedule
        ? `${schedule.class?.name ?? 'Lớp nhóm'}, ${formatDateTime(schedule.startTime)}`
        : 'Lớp nhóm'
    return 'Buổi PT 1-1'
  }

  const listState = (query: typeof requests) =>
    query.isLoading || query.isError ? (
      <StateMessage
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
      />
    ) : null

  return (
    <div className="rounded-md bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <PageHeader
        title="Duyệt hủy ca & kỷ luật"
        description="Duyệt đơn hủy ca khẩn cấp của HLV và chốt quyết định kỷ luật."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'pending', label: 'Chờ duyệt', count: pending.length },
          { value: 'history', label: 'Đã xử lý', count: history.length },
          { value: 'penalties', label: 'Kỷ luật', count: openPenalties },
        ]}
      />
      <div className="mb-3 empty:hidden">
        <FormError>{error}</FormError>
      </div>

      {tab === 'pending' ? (
        <Panel>
          {listState(requests) ?? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>HLV</Th>
                    <Th>Buổi bị hủy</Th>
                    <Th>Lý do</Th>
                    <Th>Gửi lúc</Th>
                    <Th className="text-right">Quyết định & Chi tiết</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.length === 0 ? (
                    <EmptyRow colSpan={5}>Không có đơn nào đang chờ duyệt.</EmptyRow>
                  ) : (
                    pendingPage.items.map((item) => (
                      <tr key={item.id}>
                        <Td className="font-medium text-slate-900">{coachName(item.coachId)}</Td>
                        <Td>{target(item)}</Td>
                        <Td className="max-w-[280px] whitespace-pre-line">{item.reasonMessage}</Td>
                        <Td className="whitespace-nowrap">{formatDateTime(item.createdAt)}</Td>
                        <Td className="whitespace-nowrap text-right">
                          <Btn
                            size="sm"
                            tone="primary"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(item.id)}
                          >
                            Duyệt
                          </Btn>
                          <Btn
                            size="sm"
                            tone="danger"
                            className="ml-1.5"
                            onClick={() => setRejecting(item)}
                          >
                            Từ chối
                          </Btn>
                          <Btn
                            size="sm"
                            tone="ghost"
                            className="ml-1.5"
                            onClick={() => setDetailItem(item)}
                          >
                            Xem chi tiết đơn
                          </Btn>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination pager={pendingPage.pager} />
            </>
          )}
        </Panel>
      ) : null}

      {tab === 'history' ? (
        <Panel>
          {listState(requests) ?? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>HLV</Th>
                    <Th>Buổi</Th>
                    <Th>Lý do</Th>
                    <Th>Kết quả</Th>
                    <Th>Xử lý lúc</Th>
                    <Th className="text-right">Chi tiết</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <EmptyRow colSpan={6}>Chưa có đơn đã xử lý.</EmptyRow>
                  ) : (
                    historyPage.items.map((item) => (
                      <tr key={item.id}>
                        <Td className="font-medium text-slate-900">{coachName(item.coachId)}</Td>
                        <Td>{target(item)}</Td>
                        <Td className="max-w-[260px]">
                          {item.reasonMessage}
                          {item.rejectionReason ? (
                            <div className="mt-1 text-xs text-rose-700">
                              Lý do từ chối: {item.rejectionReason}
                            </div>
                          ) : null}
                        </Td>
                        <Td>
                          <Pill tone={statusTone[item.status]}>
                            {cancellationStatusLabel[item.status]}
                          </Pill>
                          {item.isFrontdeskOverride ? (
                            <div className="mt-1 text-xs text-slate-400">Lễ tân xử lý</div>
                          ) : null}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {formatDateTime(item.reviewedAt ?? item.createdAt)}
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          <Btn
                            size="sm"
                            tone="ghost"
                            onClick={() => setDetailItem(item)}
                          >
                            Xem chi tiết
                          </Btn>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination pager={historyPage.pager} />
            </>
          )}
        </Panel>
      ) : null}

      {tab === 'penalties' ? (
        <Panel>
          {penalties.isLoading || penalties.isError ? (
            <StateMessage
              loading={penalties.isLoading}
              error={penalties.isError ? errorMessage(penalties.error) : null}
              onRetry={() => void penalties.refetch()}
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>HLV</Th>
                    <Th>Tháng</Th>
                    <Th>Hệ thống đề xuất</Th>
                    <Th>Quyết định của quản lý</Th>
                    <Th className="text-right">Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {penaltyRows.length === 0 ? (
                    <EmptyRow colSpan={5}>Chưa có vi phạm nào.</EmptyRow>
                  ) : (
                    penaltyPage.items.map((p) => (
                      <tr key={p.id}>
                        <Td className="font-medium text-slate-900">{coachName(p.coachId)}</Td>
                        <Td className="tabular-nums">{p.appliedMonth}</Td>
                        <Td>
                          {actionLabel[p.suggestedAction] ?? p.suggestedAction}
                          {Number(p.suggestedRateReductionPct) > 0
                            ? `, giảm ${Number(p.suggestedRateReductionPct)}% biểu phí`
                            : ''}
                          {p.notes ? (
                            <div className="mt-1 text-xs text-slate-400">{p.notes}</div>
                          ) : null}
                        </Td>
                        <Td className="max-w-[300px]">
                          {p.isReviewedByManager ? (
                            <>
                              <div className="whitespace-pre-line">{p.managerFinalDecision}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                {formatDateTime(p.reviewedAt)}
                              </div>
                            </>
                          ) : (
                            <Pill tone="amber">Chưa chốt</Pill>
                          )}
                        </Td>
                        <Td className="text-right">
                          <Btn size="sm" onClick={() => setReviewing(p)}>
                            {p.isReviewedByManager ? 'Sửa quyết định' : 'Chốt quyết định'}
                          </Btn>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <Pagination pager={penaltyPage.pager} />
            </>
          )}
        </Panel>
      ) : null}

      {detailItem ? (
        <CancellationDetailModal
          request={detailItem}
          coachName={coachName(detailItem.coachId)}
          targetName={target(detailItem)}
          onClose={() => setDetailItem(null)}
          onApprove={() => {
            approve.mutate(detailItem.id)
            setDetailItem(null)
          }}
          onReject={() => {
            const req = detailItem
            setDetailItem(null)
            setRejecting(req)
          }}
          onWithdraw={() => {
            if (
              window.confirm(
                'Hủy đơn này? Buổi tập vẫn giữ nguyên như chưa có đơn.',
              )
            ) {
              withdraw.mutate(detailItem.id)
              setDetailItem(null)
            }
          }}
          isApproving={approve.isPending}
          isWithdrawing={withdraw.isPending}
        />
      ) : null}

      {rejecting ? (
        <RejectForm
          request={rejecting}
          coachName={coachName(rejecting.coachId)}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null)
            refreshRequests()
          }}
        />
      ) : null}
      {reviewing ? (
        <PenaltyForm
          penalty={reviewing}
          coachName={coachName(reviewing.coachId)}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            void queryClient.invalidateQueries({ queryKey: managerKeys.penalties })
          }}
        />
      ) : null}
    </div>
  )
}

function CancellationDetailModal({
  request,
  coachName,
  targetName,
  onClose,
  onApprove,
  onReject,
  onWithdraw,
  isApproving,
  isWithdrawing,
}: {
  request: CancellationRequest
  coachName: string
  targetName: string
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
  onWithdraw?: () => void
  isApproving?: boolean
  isWithdrawing?: boolean
}) {
  const isPending = request.status === 'PENDING'

  return (
    <Modal
      title="Chi tiết đơn hủy ca khẩn cấp"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div>
            {isPending && onWithdraw && (
              <Btn
                size="sm"
                tone="ghost"
                disabled={isWithdrawing}
                onClick={onWithdraw}
                title="Hủy đơn mà không duyệt hay từ chối"
              >
                {isWithdrawing ? 'Đang hủy đơn…' : 'Hủy đơn này'}
              </Btn>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" onClick={onClose}>
              Đóng
            </Btn>
            {isPending && onReject && (
              <Btn size="sm" tone="danger" onClick={onReject}>
                Từ chối
              </Btn>
            )}
            {isPending && onApprove && (
              <Btn size="sm" tone="primary" disabled={isApproving} onClick={onApprove}>
                {isApproving ? 'Đang duyệt…' : 'Duyệt đơn'}
              </Btn>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Huấn luyện viên:</span>
            <strong className="text-slate-900 text-sm font-semibold">{coachName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Buổi tập bị hủy:</span>
            <span className="text-slate-800 font-medium">{targetName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Thời gian gửi đơn:</span>
            <span className="text-slate-700 font-mono">{formatDateTime(request.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <Pill tone={statusTone[request.status]}>
              {cancellationStatusLabel[request.status]}
            </Pill>
          </div>
        </div>

        {/* Reason Message */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Mô tả lý do hủy ca của HLV
          </label>
          <div className="p-4 rounded-md border border-slate-200 bg-white text-sm text-slate-800 whitespace-pre-line leading-relaxed shadow-2xs">
            {request.reasonMessage || 'Không có mô tả chi tiết.'}
          </div>
        </div>

        {/* If Rejected */}
        {request.rejectionReason && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-600">
              Lý do từ chối của Quản lý
            </label>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900 whitespace-pre-line">
              {request.rejectionReason}
            </div>
          </div>
        )}

        {/* Review time */}
        {request.reviewedAt && (
          <p className="text-xs text-slate-400">
            Đã xử lý lúc {formatDateTime(request.reviewedAt)}
            {request.isFrontdeskOverride ? ' (do Lễ tân xử lý)' : ''}
          </p>
        )}
      </div>
    </Modal>
  )
}

function RejectForm({
  request,
  coachName,
  onClose,
  onDone,
}: {
  request: CancellationRequest
  coachName: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const reject = useMutation({
    mutationFn: () =>
      managerApi.reviewCancellation(request.id, {
        action: 'REJECT',
        rejectionReason: reason.trim(),
      }),
    onSuccess: onDone,
    onError: (err) => setError(errorMessage(err)),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!reason.trim()) return setError('Cần nhập lý do từ chối.')
    reject.mutate()
  }
  return (
    <Modal
      title={`Từ chối đơn của ${coachName}`}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="danger" type="submit" form="reject-form" disabled={reject.isPending}>
            {reject.isPending ? 'Đang gửi…' : 'Từ chối đơn'}
          </Btn>
        </>
      }
    >
      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {request.reasonMessage}
      </p>
      <form id="reject-form" onSubmit={submit} className="space-y-3">
        <Field label="Lý do từ chối" hint="HLV sẽ thấy lý do này.">
          <TextArea
            required
            maxLength={2000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}

function PenaltyForm({
  penalty,
  coachName,
  onClose,
  onDone,
}: {
  penalty: CoachPenalty
  coachName: string
  onClose: () => void
  onDone: () => void
}) {
  const [decision, setDecision] = useState(penalty.managerFinalDecision ?? '')
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => managerApi.reviewPenalty(penalty.id, decision.trim()),
    onSuccess: onDone,
    onError: (err) => setError(errorMessage(err)),
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const length = decision.trim().length
    if (length < 5 || length > 2000) return setError('Quyết định cần từ 5 đến 2000 ký tự.')
    save.mutate()
  }
  return (
    <Modal
      title={`Kỷ luật ${coachName}, tháng ${penalty.appliedMonth}`}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Hủy</Btn>
          <Btn tone="primary" type="submit" form="penalty-form" disabled={save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu quyết định'}
          </Btn>
        </>
      }
    >
      <form id="penalty-form" onSubmit={submit} className="space-y-3">
        <Field
          label="Quyết định cuối cùng"
          hint={`${decision.trim().length}/2000 ký tự, tối thiểu 5.`}
        >
          <TextArea
            rows={5}
            maxLength={2000}
            placeholder="Ví dụ: Nhắc nhở lần 1, yêu cầu cam kết lịch dạy tháng tới."
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
          />
        </Field>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  )
}
