import type {
  Activity,
  ActivityTotals,
  HumanResourceItem,
  MaterialItem,
} from '@/types/activity'
import { toSafeNumber } from './currency'

export function materialLineTotal(
  item: Pick<MaterialItem, 'cantidad' | 'valorUnitario'>,
): number {
  const cantidad = Math.max(0, Math.trunc(toSafeNumber(item.cantidad)))
  const valorUnitario = Math.max(0, toSafeNumber(item.valorUnitario))
  return Math.round(cantidad * valorUnitario)
}

export function humanResourceLineTotal(
  item: Pick<HumanResourceItem, 'cantidad' | 'valorPorEvento'>,
): number {
  const cantidad = Math.max(0, Math.trunc(toSafeNumber(item.cantidad)))
  const valorPorEvento = Math.max(0, toSafeNumber(item.valorPorEvento))
  return Math.round(cantidad * valorPorEvento)
}

export function materialsSubtotal(items: MaterialItem[]): number {
  return items.reduce((total, item) => total + materialLineTotal(item), 0)
}

export function humanResourcesSubtotal(items: HumanResourceItem[]): number {
  return items.reduce((total, item) => total + humanResourceLineTotal(item), 0)
}

export function activityTotals(
  activity: Pick<Activity, 'materiales' | 'recursosHumanos'>,
): ActivityTotals {
  const materiales = materialsSubtotal(activity.materiales ?? [])
  const recursosHumanos = humanResourcesSubtotal(activity.recursosHumanos ?? [])
  return {
    materiales,
    recursosHumanos,
    total: materiales + recursosHumanos,
  }
}
