/**
 * Date utilities for Monday-Sunday week calendar (Asia/Ho_Chi_Minh)
 */

export const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseYMDToDate = (ymd: string): Date => {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Returns Monday of the week for the given date as YYYY-MM-DD.
 * Weeks run Monday to Sunday.
 */
export const getMondayOfWeek = (dateInput: Date | string = new Date()): string => {
  const d = typeof dateInput === 'string' ? parseYMDToDate(dateInput) : new Date(dateInput)
  const day = d.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDateToYMD(d)
}

/**
 * Adds or subtracts weeks from a given Monday string (YYYY-MM-DD)
 */
export const shiftWeek = (mondayYMD: string, offsetWeeks: number): string => {
  const date = parseYMDToDate(mondayYMD)
  date.setDate(date.getDate() + offsetWeeks * 7)
  return formatDateToYMD(date)
}

export interface DayColumnInfo {
  date: Date
  dateString: string // YYYY-MM-DD
  dayLabel: string // "Thứ 2", "Chủ Nhật"
  dayNumber: number // 28
  monthNumber: number // 9
  isToday: boolean
}

export const VIETNAMESE_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

export const getWeekDays = (mondayYMD: string): DayColumnInfo[] => {
  const todayYMD = formatDateToYMD(new Date())
  const monday = parseYMDToDate(mondayYMD)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateString = formatDateToYMD(d)
    return {
      date: d,
      dateString,
      dayLabel: VIETNAMESE_DAYS[i],
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
      isToday: dateString === todayYMD,
    }
  })
}

export const formatTimeHHmm = (isoString: string): string => {
  try {
    const d = new Date(isoString)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

export const formatRangeLabel = (mondayYMD: string): string => {
  const days = getWeekDays(mondayYMD)
  const start = days[0]
  const end = days[6]
  return `${start.dayNumber}/${start.monthNumber} - ${end.dayNumber}/${end.monthNumber}/${end.date.getFullYear()}`
}

export const CALENDAR_START_HOUR = 6 // 06:00
export const CALENDAR_END_HOUR = 22 // 22:00
export const HOUR_HEIGHT_PX = 68 // Height in px for 1 hour row

/**
 * Calculates top offset and height in pixels for an event spanning startAt to endAt
 */
export const calculateEventPosition = (
  startAt: string,
  endAt: string,
): { top: number; height: number } => {
  const start = new Date(startAt)
  const end = new Date(endAt)

  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60

  // Clamp within calendar boundaries
  const clampedStart = Math.max(startHour, CALENDAR_START_HOUR)
  const clampedEnd = Math.min(Math.max(endHour, clampedStart + 0.5), CALENDAR_END_HOUR + 1)

  const top = (clampedStart - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX
  const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT_PX, 32)

  return { top, height }
}

/**
 * Calculates the top offset in px for the current time indicator
 */
export const getCurrentTimeTop = (): number | null => {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  if (currentHour < CALENDAR_START_HOUR || currentHour > CALENDAR_END_HOUR + 1) {
    return null
  }
  return (currentHour - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX
}
