import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { money } from '@/lib/api'
import { cn } from '@/lib/utils'
import { managerApi, managerKeys } from '../api/manager-api'
import type { Invoice } from '../types/manager.types'
import {
  addDaysToDay,
  errorMessage,
  formatDateTime,
  formatDay,
  percent,
  vnDay,
} from '../lib/format'
import { RevenueChart, type DayRevenue } from '../components/revenue-chart'
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

const RANGES = [7, 14, 30] as const
type Range = (typeof RANGES)[number]
/** GET /billing/invoices returns at most this many, newest first. */
const INVOICE_CAP = 200

/** PT part of an invoice; the rest is the base plan. PT add-ons may not carry ptAmount. */
function split(invoice: Invoice) {
  const amount = Number(invoice.amount)
  const pt = Number(invoice.ptAmount ?? 0) || (invoice.type === 'PT_ADDON' ? amount : 0)
  return { base: amount - pt, pt }
}

/** Daily paid revenue for the last `days` days (Vietnam time), oldest first. */
function dailyRevenue(invoices: Invoice[], days: number): DayRevenue[] {
  const today = vnDay()
  const paid = invoices.filter((i) => i.status === 'PAID')
  // Once the API hits its cap, anything older than the oldest returned invoice may be missing.
  const oldest =
    invoices.length >= INVOICE_CAP ? vnDay(invoices[invoices.length - 1].createdAt) : null
  const rows = new Map<string, DayRevenue>()
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = addDaysToDay(today, -offset)
    rows.set(day, { day, base: 0, pt: 0, invoices: 0, complete: !oldest || day > oldest })
  }
  for (const invoice of paid) {
    const row = rows.get(vnDay(invoice.createdAt))
    if (!row) continue
    const { base, pt } = split(invoice)
    row.base += base
    row.pt += pt
    row.invoices += 1
  }
  return [...rows.values()]
}

function RevenueTrend() {
  const invoices = useQuery({ queryKey: managerKeys.invoices, queryFn: managerApi.invoices })
  const [range, setRange] = useState<Range>(14)
  const [asTable, setAsTable] = useState(false)
  const data = dailyRevenue(invoices.data ?? [], range)
  const base = data.reduce((sum, d) => sum + d.base, 0)
  const pt = data.reduce((sum, d) => sum + d.pt, 0)
  const count = data.reduce((sum, d) => sum + d.invoices, 0)
  const firstComplete = data.find((d) => d.complete)?.day
  const partial = data.some((d) => !d.complete)

  return (
    <Panel className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Doanh thu theo ngày</h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {money(base + pt)}
          </p>
          <p className="text-xs text-slate-500">
            {range} ngày gần nhất, {count} hóa đơn. Gói cơ bản {money(base)}, PT {money(pt)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Khoảng thời gian"
            className="flex rounded-md border border-slate-200 p-0.5"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={cn(
                  'rounded px-2.5 py-1 text-sm',
                  range === r
                    ? 'bg-emerald-50 font-medium text-[#007461]'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {r} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className="rounded-md px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            {asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}
          </button>
        </div>
      </div>

      {invoices.isLoading || invoices.isError ? (
        <StateMessage
          loading={invoices.isLoading}
          error={invoices.isError ? errorMessage(invoices.error) : null}
          onRetry={() => void invoices.refetch()}
        />
      ) : asTable ? (
        <div className="max-h-80 overflow-y-auto">
          <Table>
            <thead>
              <tr>
                <Th>Ngày</Th>
                <Th className="text-right">Gói cơ bản</Th>
                <Th className="text-right">PT</Th>
                <Th className="text-right">Tổng</Th>
                <Th className="text-right">Hóa đơn</Th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <Td className="whitespace-nowrap">
                    {formatDay(d.day)}
                    {d.complete ? null : (
                      <span className="ml-1 text-xs text-amber-700">(có thể thiếu)</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{money(d.base)}</Td>
                  <Td className="text-right tabular-nums">{money(d.pt)}</Td>
                  <Td className="text-right font-medium tabular-nums">{money(d.base + d.pt)}</Td>
                  <Td className="text-right tabular-nums">{d.invoices}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="px-4 pt-3">
          <RevenueChart data={data} />
        </div>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Tính từ hóa đơn đã thanh toán, theo giờ Việt Nam.
        {partial && firstComplete
          ? ` Hệ thống chỉ trả ${INVOICE_CAP} hóa đơn gần nhất nên số liệu đầy đủ từ ${formatDay(firstComplete)}.`
          : ''}
      </p>
    </Panel>
  )
}

export function ManagerDashboardPage() {
  const summary = useQuery({ queryKey: managerKeys.summary, queryFn: managerApi.summary })
  const revenue = useQuery({ queryKey: managerKeys.revenue, queryFn: managerApi.revenue })
  const requests = useQuery({
    queryKey: managerKeys.cancellations,
    queryFn: managerApi.cancellations,
  })
  const staff = useQuery({ queryKey: managerKeys.staff, queryFn: managerApi.staff })
  const disciplines = useQuery({
    queryKey: managerKeys.disciplines,
    queryFn: managerApi.disciplines,
  })

  const coachName = new Map((staff.data ?? []).map((user) => [user.id, user.fullName]))
  const pending = (requests.data ?? []).filter((item) => item.status === 'PENDING')
  const s = summary.data
  const r = revenue.data
  const byDiscipline = Object.entries(r?.byDiscipline ?? {}).sort((a, b) => b[1] - a[1])
  const topDiscipline = byDiscipline[0]?.[1] ?? 0
  const disciplineName = (code: string) =>
    code === 'UNSPECIFIED'
      ? 'Chưa phân môn'
      : (disciplines.data?.find((d) => d.code.toUpperCase() === code.toUpperCase())?.name ?? code)

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={s ? `Số liệu ngày ${formatDay(s.date)}` : 'Số liệu trong ngày'}
      />

      {summary.isError ? (
        <Panel className="mb-6">
          <StateMessage
            error={errorMessage(summary.error)}
            onRetry={() => void summary.refetch()}
          />
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

      <RevenueTrend />

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
                      <Td className="font-medium text-slate-900">
                        {coachName.get(item.coachId) ?? 'HLV'}
                      </Td>
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

        <Panel
          title="Doanh thu theo môn"
          actions={
            <Link to="/portal/manager/reports" className="text-sm text-[#007461] hover:underline">
              Báo cáo
            </Link>
          }
        >
          {revenue.isLoading || revenue.isError ? (
            <StateMessage
              loading={revenue.isLoading}
              error={revenue.isError ? errorMessage(revenue.error) : null}
              onRetry={() => void revenue.refetch()}
            />
          ) : r ? (
            <div className="p-4">
              <p className="text-xs text-slate-500">Cộng dồn từ trước tới nay</p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {money(r.totalRevenue)}
              </p>
              {byDiscipline.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Chưa có hóa đơn đã thanh toán.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {byDiscipline.map(([code, amount]) => (
                    <li key={code}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-slate-700">{disciplineName(code)}</span>
                        <span className="tabular-nums text-slate-900">
                          {money(amount)}
                          <span className="ml-1.5 text-xs text-slate-400">
                            {r.totalRevenue ? percent(amount / r.totalRevenue) : '0%'}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-sm bg-slate-100">
                        <div
                          className="h-2 rounded-sm bg-[#008b74]"
                          style={{
                            width: `${topDiscipline ? Math.max(2, (amount / topDiscipline) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  )
}
