const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function parseISODate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function formatDateCL(value: string): string {
  const date = parseISODate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateLong(value: string): string {
  const date = parseISODate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDateShortMonth(value: string): string {
  const date = parseISODate(value)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const monthNames = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ]
  return `${day} ${monthNames[date.getMonth()]}`
}

export function formatBudgetTitleRange(start: string, end: string): string {
  const s = formatDateShortMonth(start)
  const e = formatDateShortMonth(end)
  if (s && e) {
    return `${s} AL ${e}`
  }
  if (s) return s
  if (e) return e
  return ''
}

export function formatDateTimeCL(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function todayISO(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value)
}

export function isValidDateRange(start: string, end: string): boolean {
  if (!isValidISODate(start) || !isValidISODate(end)) return false
  return end >= start
}

export function formatRange(start: string, end: string): string {
  return `${formatDateCL(start)} — ${formatDateCL(end)}`
}
