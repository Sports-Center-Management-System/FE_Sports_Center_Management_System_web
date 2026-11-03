import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { money } from '@/lib/api'
import { managerApi, managerKeys } from '../api/manager-api'
import { errorMessage, formatDateTime, formatDay, percent } from '../lib/format'
import { EmptyRow, PageHeader, Panel, Stat, StateMessage, Table, Td, Th } from '../components/manager-ui'

export function ManagerDashboardPage() {
  const summary = useQuery({ queryKey: managerKeys.summary, queryFn: managerApi.summary })
  const revenue = useQuery({ queryKey: managerKeys.revenue, queryFn: managerApi.revenue })
  const requests = useQuery({ queryKey: managerKeys.cancellations, queryFn: managerApi.cancellations })
  const staff = useQuery({ queryKey: managerKeys.staff, queryFn: managerApi.staff })

  const coachName = new Map((staff.data ?? []).map((user) => [user.id, user.fullName]))
  const pending = (requests.data ?? []).filter((item) => item.status === 'PENDING')
  const s = summary.data
  const r = revenue.data
  const disciplines = Object.entries(r?.byDiscipline ?? {}).sort((a, b) => b[1] - a[1])

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={s ? `Số liệu ngày ${formatDay(s.date)}` : 'Số liệu trong ngày'}
      />

      {summary.isError ? (
        <Panel className="mb-6">
          <StateMessage error={errorMessage(summary.error)} onRetry={() => void summary.refetch()} />
        </Panel>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Doanh thu hôm nay" value={s ? money(s.dailyRevenue) : '…'} />
          <Stat label="Hội viên mới" value={s?.newMembers ?? '…'} />
          <Stat label="Lượt vào cổng" value={s?.gateEntries ?? '…'} />
          <Stat label="Lấp đầy lớp hôm nay" value={s ? percent(s.occupancyRate) : '…'} />
          <Stat label="Đơn hủy ca chờ duyệt" value={s?.pendingCancellations ?? '…'} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title="Đơn hủy ca chờ duyệt"
          actions={
            <Link to="/portal/manager/penalties" className="text-sm text-[#007461] hover:underline">
              Xem tất cả
            </Link>
          }
        >
          {requests.isLoading || requests.isError ? (
            <StateMessage
              loading={requests.isLoading}
              error={requests.isError ? errorMessage(requests.error) : null}
              onRetry={() => void requests.refetch()}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>HLV</Th>
                  <Th>Loại</Th>
                  <Th>Lý do</Th>
                  <Th>Gửi lúc</Th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <EmptyRow colSpan={4}>Không có đơn nào đang chờ.</EmptyRow>
                ) : (
                  pending.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <Td className="font-medium text-slate-900">{coachName.get(item.coachId) ?? 'HLV'}</Td>
                      <Td>{item.targetType === 'GROUP_CLASS' ? 'Lớp nhóm' : 'PT 1-1'}</Td>
                      <Td className="max-w-[260px] truncate">{item.reasonMessage}</Td>
                      <Td className="whitespace-nowrap">{formatDateTime(item.createdAt)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel title="Cơ cấu doanh thu (toàn thời gian)">
          {revenue.isLoading || revenue.isError ? (
            <StateMessage
              loading={revenue.isLoading}
              error={revenue.isError ? errorMessage(revenue.error) : null}
              onRetry={() => void revenue.refetch()}
            />
          ) : r ? (
            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs text-slate-500">Tổng doanh thu</p>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">{money(r.totalRevenue)}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Gói cơ bản</dt>
                  <dd className="tabular-nums">{money(r.baseRevenue)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">PT</dt>
                  <dd className="tabular-nums">{money(r.ptRevenue)}</dd>
                </div>
              </dl>
              <ul className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                {disciplines.length === 0 ? (
                  <li className="text-slate-400">Chưa có hóa đơn đã thanh toán.</li>
                ) : (
                  disciplines.map(([code, amount]) => (
                    <li key={code} className="flex justify-between gap-3">
                      <span className="text-slate-600">{code === 'UNSPECIFIED' ? 'Chưa phân môn' : code}</span>
                      <span className="tabular-nums">{money(amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  )
}
