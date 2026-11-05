import { useQuery } from '@tanstack/react-query'
import { money } from '@/lib/api'
import { managerApi, managerKeys } from '../api/manager-api'
import { errorMessage } from '../lib/format'
import {
  EmptyRow,
  PageHeader,
  Panel,
  Stat,
  StateMessage,
  Table,
  Td,
  Th,
} from '../components/manager-ui'

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full rounded-sm bg-slate-100">
      <div className="h-2 rounded-sm bg-[#008b74]" style={{ width: `${width}%` }} />
    </div>
  )
}

const share = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : '0%'

export function ManagerReportsPage() {
  const revenue = useQuery({ queryKey: managerKeys.revenue, queryFn: managerApi.revenue })
  const kpi = useQuery({ queryKey: managerKeys.kpi, queryFn: managerApi.kpi })
  const r = revenue.data
  const disciplines = Object.entries(r?.byDiscipline ?? {}).sort((a, b) => b[1] - a[1])
  const topDiscipline = disciplines[0]?.[1] ?? 0
  const coaches = [...(kpi.data?.coaches ?? [])].sort(
    (a, b) => b._count.coachedSchedules - a._count.coachedSchedules,
  )
  const rooms = [...(kpi.data?.rooms ?? [])].sort(
    (a, b) => b.totalScheduledHours - a.totalScheduledHours,
  )
  const topRoom = rooms[0]?.totalScheduledHours ?? 0

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Số liệu cộng dồn từ trước tới nay. Hệ thống chưa hỗ trợ lọc theo khoảng ngày."
      />

      {revenue.isLoading || revenue.isError ? (
        <Panel className="mb-6">
          <StateMessage
            loading={revenue.isLoading}
            error={revenue.isError ? errorMessage(revenue.error) : null}
            onRetry={() => void revenue.refetch()}
          />
        </Panel>
      ) : r ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Tổng doanh thu" value={money(r.totalRevenue)} />
            <Stat
              label="Gói cơ bản"
              value={money(r.baseRevenue)}
              hint={`${share(r.baseRevenue, r.totalRevenue)} tổng`}
            />
            <Stat
              label="PT"
              value={money(r.ptRevenue)}
              hint={`${share(r.ptRevenue, r.totalRevenue)} tổng`}
            />
          </div>
          <Panel title="Doanh thu theo môn" className="mb-6">
            <Table>
              <thead>
                <tr>
                  <Th>Môn</Th>
                  <Th className="w-1/2" />
                  <Th className="text-right">Doanh thu</Th>
                  <Th className="text-right">Tỷ trọng</Th>
                </tr>
              </thead>
              <tbody>
                {disciplines.length === 0 ? (
                  <EmptyRow colSpan={4}>Chưa có hóa đơn đã thanh toán.</EmptyRow>
                ) : (
                  disciplines.map(([code, amount]) => (
                    <tr key={code}>
                      <Td className="font-medium text-slate-900">
                        {code === 'UNSPECIFIED' ? 'Chưa phân môn' : code}
                      </Td>
                      <Td>
                        <Bar value={amount} max={topDiscipline} />
                      </Td>
                      <Td className="text-right tabular-nums">{money(amount)}</Td>
                      <Td className="text-right tabular-nums">{share(amount, r.totalRevenue)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Panel>
        </>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="KPI huấn luyện viên">
          {kpi.isLoading || kpi.isError ? (
            <StateMessage
              loading={kpi.isLoading}
              error={kpi.isError ? errorMessage(kpi.error) : null}
              onRetry={() => void kpi.refetch()}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>HLV</Th>
                  <Th className="text-right">Lớp được xếp</Th>
                  <Th className="text-right">Slot PT đã mở</Th>
                  <Th className="text-right">Hủy khẩn tháng này</Th>
                  <Th className="text-right">Tổng hủy khẩn</Th>
                </tr>
              </thead>
              <tbody>
                {coaches.length === 0 ? (
                  <EmptyRow colSpan={5}>Chưa có HLV.</EmptyRow>
                ) : (
                  coaches.map((coach) => {
                    const monthly = coach.coachProfile?.monthlyEmergencyCancellations ?? 0
                    return (
                      <tr key={coach.id}>
                        <Td className="font-medium text-slate-900">{coach.fullName}</Td>
                        <Td className="text-right tabular-nums">{coach._count.coachedSchedules}</Td>
                        <Td className="text-right tabular-nums">
                          {coach._count.coachAvailabilities}
                        </Td>
                        <Td
                          className={
                            monthly > 0
                              ? 'text-right tabular-nums text-rose-700'
                              : 'text-right tabular-nums'
                          }
                        >
                          {monthly}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {coach.coachProfile?.emergencyCancellationCount ?? 0}
                        </Td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel title="Giờ sử dụng phòng">
          {kpi.isLoading || kpi.isError ? (
            <StateMessage
              loading={kpi.isLoading}
              error={kpi.isError ? errorMessage(kpi.error) : null}
            />
          ) : (
            <ul className="space-y-3 p-4">
              {rooms.length === 0 ? (
                <li className="text-sm text-slate-400">Chưa có phòng.</li>
              ) : null}
              {rooms.map((room) => (
                <li key={room.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="text-slate-700">{room.name}</span>
                    <span className="tabular-nums text-slate-500">
                      {room.totalScheduledHours.toFixed(1)} giờ
                    </span>
                  </div>
                  <Bar value={room.totalScheduledHours} max={topRoom} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
