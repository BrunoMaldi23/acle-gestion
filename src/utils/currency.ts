const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCLP(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0
  return clpFormatter.format(safe)
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('es-CL').format(value)
}

export function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/\s/g, '').replace(/,/g, '.')
    if (cleaned === '') return 0
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}
