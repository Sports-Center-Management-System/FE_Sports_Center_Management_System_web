import React, { useState } from 'react'
import type { Discipline, CalendarSubscription } from '../types/calendar.types'
import { formatRangeLabel } from '../utils/calendar-date.utils'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MemberDatePickerModal } from './member-date-picker-modal'

const disciplineTagClass = (discipline: Discipline) => {
  const value = `${discipline.code} ${discipline.name}`.toLowerCase()
  if (value.includes('gym') || value.includes('fitness')) return 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'
  if (value.includes('box') || value.includes('combat')) return 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
  if (value.includes('yoga')) return 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100'
  if (value.includes('dance') || value.includes('zumba')) return 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
  return 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
}

interface CalendarHeaderProps {
  currentWeek: string
  onWeekChange: (direction: 'prev' | 'next') => void
  onGoToCurrentWeek: () => void
  onSelectWeek?: (weekMonday: string) => void
  selectedDisciplineId: string
  onDisciplineChange: (disciplineId: string) => void
  disciplines: Discipline[]
  subscriptions: CalendarSubscription[]
  isLoading?: boolean
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentWeek,
  onWeekChange,
  onGoToCurrentWeek,
  onSelectWeek,
  selectedDisciplineId,
  onDisciplineChange,
  disciplines,
  subscriptions,
  isLoading,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200 top-0 z-30 shadow-xs rounded-t-3xl">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navigation Controls: Today, Prev, Next, Range, Select Date Modal */}
          <div className="flex relative items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={onGoToCurrentWeek}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-2xs"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#008b74]" />
              Tuần này
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onWeekChange('prev')}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
                title="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-800 min-w-[130px] text-center select-none">
                {formatRangeLabel(currentWeek)}
              </span>
              <button
                type="button"
                onClick={() => onWeekChange('next')}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
                title="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Chọn lịch modal button */}
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50/70 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 transition shadow-2xs cursor-pointer"
              title="Chọn ngày / tuần để xem lịch tập"
            >
              <CalendarDays className="h-3.5 w-3.5 text-[#008b74]" />
              <span>Chọn lịch</span>
            </button>
          </div>
        </div>

        {/* Modal Chọn Lịch */}
        <MemberDatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          currentWeek={currentWeek}
          onSelectWeek={(weekMonday) => {
            onSelectWeek?.(weekMonday)
          }}
        />

        {/* Filter bar & Subscriptions Summary */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDisciplineChange('all')}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  selectedDisciplineId === 'all'
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                Tất cả bộ môn
              </button>
              {disciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  type="button"
                  onClick={() => onDisciplineChange(discipline.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    disciplineTagClass(discipline),
                    selectedDisciplineId === discipline.id && 'ring-2 ring-offset-1 ring-slate-500',
                  )}
                >
                  {discipline.name}
                </button>
              ))}
            </div>

            {isLoading && (
              <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Đang đồng bộ...
              </span>
            )}
          </div>

          {/* Active Subscriptions Quota Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Gói & Quota:
            </span>
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  title={`Hạn sử dụng đến: ${new Date(sub.endDate).toLocaleDateString('vi-VN')}`}
                >
                  <span className="font-bold text-slate-800">{sub.planName}</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">
                      Nhóm: {sub.remainingGroupSessions}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                      PT: {sub.remainingPtSessions}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Chưa có gói tập khả dụng</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
