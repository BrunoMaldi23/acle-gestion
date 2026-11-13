import { describe, expect, it } from 'vitest'
import {
  activityTotals,
  humanResourceLineTotal,
  humanResourcesSubtotal,
  materialLineTotal,
  materialsSubtotal,
} from '@/utils/calculations'
import type { HumanResourceItem, MaterialItem } from '@/types/activity'

function material(overrides: Partial<MaterialItem> = {}): MaterialItem {
  return {
    id: 'material-1',
    cantidad: 2,
    materiales: 'Balones',
    caracteristicas: 'N°5',
    valorUnitario: 1000,
    fechaRequerimiento: '2026-03-01',
    ...overrides,
  }
}

function humanResource(
  overrides: Partial<HumanResourceItem> = {},
): HumanResourceItem {
  return {
    id: 'rh-1',
    cantidad: 1,
    recursoHumano: 'Monitor',
    funcion: 'Coordinación',
    valorPorEvento: 25000,
    fechaRequerimiento: '2026-03-01',
    ...overrides,
  }
}

describe('materialLineTotal', () => {
  it('calcula cantidad por valor unitario', () => {
    expect(materialLineTotal({ cantidad: 3, valorUnitario: 2500 })).toBe(7500)
  })

  it('redondea el resultado a pesos sin decimales', () => {
    expect(materialLineTotal({ cantidad: 2, valorUnitario: 1234.6 })).toBe(2469)
  })

  it('no devuelve valores negativos', () => {
    expect(materialLineTotal({ cantidad: -4, valorUnitario: 5000 })).toBe(0)
    expect(materialLineTotal({ cantidad: 2, valorUnitario: -5000 })).toBe(0)
  })

  it('maneja valores NaN como cero', () => {
    expect(
      materialLineTotal({
        cantidad: Number.NaN,
        valorUnitario: Number.POSITIVE_INFINITY,
      }),
    ).toBe(0)
  })
})

describe('humanResourceLineTotal', () => {
  it('multiplica la cantidad por el valor por evento', () => {
    expect(humanResourceLineTotal({ cantidad: 3, valorPorEvento: 20000 })).toBe(
      60000,
    )
  })

  it('no devuelve valores negativos', () => {
    expect(humanResourceLineTotal({ cantidad: -1, valorPorEvento: 20000 })).toBe(
      0,
    )
  })
})

describe('subtotales y total general', () => {
  it('suma los materiales', () => {
    expect(
      materialsSubtotal([
        material({ cantidad: 2, valorUnitario: 1000 }),
        material({ id: 'material-2', cantidad: 3, valorUnitario: 500 }),
      ]),
    ).toBe(3500)
  })

  it('suma los recursos humanos', () => {
    expect(
      humanResourcesSubtotal([
        humanResource({ cantidad: 2, valorPorEvento: 10000 }),
        humanResource({ id: 'rh-2', cantidad: 1, valorPorEvento: 15000 }),
      ]),
    ).toBe(35000)
  })

  it('calcula el total general de una actividad', () => {
    const totals = activityTotals({
      materiales: [material({ cantidad: 2, valorUnitario: 1000 })],
      recursosHumanos: [
        humanResource({ cantidad: 2, valorPorEvento: 10000 }),
      ],
    })

    expect(totals.materiales).toBe(2000)
    expect(totals.recursosHumanos).toBe(20000)
    expect(totals.total).toBe(22000)
  })

  it('devuelve ceros cuando no hay filas', () => {
    expect(activityTotals({ materiales: [], recursosHumanos: [] })).toEqual({
      materiales: 0,
      recursosHumanos: 0,
      total: 0,
    })
  })
})
