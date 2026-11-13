import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import {
  buildActivitiesWorkbook,
  buildActivityWorkbook,
} from '@/services/excelWorkbookBuilder'
import type { Activity } from '@/types/activity'

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    responsable: 'María González',
    taller: 'Voleibol',
    fechaInicio: '2026-03-02',
    fechaTermino: '2026-05-30',
    horaInicio: '15:00',
    horaTermino: '17:00',
    titulo: 'Taller de iniciación al voleibol',
    descripcion:
      'Taller orientado a estudiantes de enseñanza media para aprender fundamentos del voleibol.',
    materiales: [
      {
        id: 'm1',
        cantidad: 2,
        materiales: 'Balones de voleibol',
        caracteristicas: 'N°5, cuero sintético',
        valorUnitario: 15000,
        fechaRequerimiento: '2026-03-01',
      },
      {
        id: 'm2',
        cantidad: 10,
        materiales: 'Petos deportivos',
        caracteristicas: 'Talla adulto',
        valorUnitario: 3000,
        fechaRequerimiento: '2026-03-01',
      },
    ],
    recursosHumanos: [
      {
        id: 'r1',
        cantidad: 1,
        recursoHumano: 'Monitor deportivo',
        funcion: 'Coordinación del taller',
        valorPorEvento: 40000,
        fechaRequerimiento: '2026-03-01',
      },
    ],
    solicitudOperaciones: 'Montaje de cancha y mesas de control.',
    solicitudAudio: 'Micrófono inalámbrico y parlante.',
    solicitudAsistentes: '2 asistentes de apoyo logístico.',
    profesorResponsable: 'Juan Pérez',
    coordinador: 'Carolina Díaz',
    estado: 'finalizada',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    ...overrides,
  }
}

function collectStringValues(ws: ExcelJS.Worksheet): string[] {
  const values: string[] = []
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (typeof cell.value === 'string') values.push(cell.value)
    })
  })
  return values
}

function countRowsWithValue(ws: ExcelJS.Worksheet, expected: string): number {
  let count = 0
  ws.eachRow({ includeEmpty: false }, (row) => {
    let found = false
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.value === expected) found = true
    })
    if (found) count += 1
  })
  return count
}

function collectFormulas(ws: ExcelJS.Worksheet): string[] {
  const formulas: string[] = []
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value
      if (value && typeof value === 'object' && 'formula' in value) {
        formulas.push((value as { formula: string }).formula)
      }
    })
  })
  return formulas
}

function findRowByColumnValue(
  ws: ExcelJS.Worksheet,
  column: number,
  expected: string,
): ExcelJS.Row | undefined {
  let found: ExcelJS.Row | undefined
  ws.eachRow({ includeEmpty: false }, (row) => {
    if (row.getCell(column).value === expected) found = row
  })
  return found
}

describe('buildActivityWorkbook', () => {
  it('genera una hoja con el formato oficial del presupuesto ACLE', () => {
    const workbook = buildActivityWorkbook(createActivity())
    expect(workbook.worksheets).toHaveLength(1)

    const ws = workbook.worksheets[0]
    const strings = collectStringValues(ws)

    expect(strings.some((s) => s.includes('PRESUPUESTO'))).toBe(true)
    expect(strings).toContain('DESCRIPCIÓN DE LA PROPUESTA')
    expect(strings).toContain('PRESUPUESTO MATERIALES')
    expect(strings).toContain('CARACTERISTICAS TECNICA')
    expect(strings).toContain('PRESUPUESTO RECURSO HUMANO')
    expect(strings).toContain('solicitudes operaciones:')
    expect(strings).toContain('solicitud a audio')
    expect(strings).toContain('solicitud a asistentes')
    expect(strings).toContain('NOMBRE Y FIRMA DEL PROFESOR')
    expect(strings).toContain('COORDINADOR FIRMA DEL PROFESOR')
  })

  it('incluye las 3 solicitudes con sus valores', () => {
    const workbook = buildActivityWorkbook(createActivity())
    const strings = collectStringValues(workbook.worksheets[0])

    expect(strings).toContain('Montaje de cancha y mesas de control.')
    expect(strings).toContain('Micrófono inalámbrico y parlante.')
    expect(strings).toContain('2 asistentes de apoyo logístico.')
  })

  it('incluye materiales con descripción y fórmula de total por fila', () => {
    const workbook = buildActivityWorkbook(createActivity())
    const ws = workbook.worksheets[0]

    const materialRow = findRowByColumnValue(ws, 3, 'Balones de voleibol')
    expect(materialRow).toBeDefined()
    expect(materialRow?.getCell(2).value).toBe(2)
    expect(materialRow?.getCell(4).value).toBe('N°5, cuero sintético')
    expect(materialRow?.getCell(5).value).toBe(15000)

    const totalValue = materialRow?.getCell(6).value as { formula?: string }
    expect(totalValue.formula).toMatch(/^B\d+\*E\d+$/)
  })

  it('crea todas las filas dinámicas de materiales', () => {
    const materials = Array.from({ length: 6 }, (_, index) => ({
      id: `dynamic-${index}`,
      cantidad: index + 1,
      materiales: `Material dinámico ${index + 1}`,
      caracteristicas: `Descripción dinámica ${index + 1}`,
      valorUnitario: 1000 * (index + 1),
      fechaRequerimiento: '2026-03-01',
    }))

    const workbook = buildActivityWorkbook(createActivity({ materiales: materials }))
    const strings = collectStringValues(workbook.worksheets[0])

    materials.forEach((material) => {
      expect(strings).toContain(material.materiales)
      expect(strings).toContain(material.caracteristicas)
    })
  })

  it('produce un archivo xlsx válido que puede volver a cargarse', async () => {
    const workbook = buildActivityWorkbook(createActivity())
    const buffer = await workbook.xlsx.writeBuffer()

    const reloaded = new ExcelJS.Workbook()
    await reloaded.xlsx.load(buffer)

    expect(reloaded.worksheets).toHaveLength(1)
    const strings = collectStringValues(reloaded.worksheets[0])
    expect(strings.some((s) => s.includes('PRESUPUESTO'))).toBe(true)
  })

  it('maneja actividades sin materiales ni recursos humanos manteniendo la cuadrícula oficial', async () => {
    const workbook = buildActivityWorkbook(
      createActivity({ materiales: [], recursosHumanos: [] }),
    )
    const ws = workbook.worksheets[0]

    expect(ws.rowCount).toBeGreaterThan(20)
    const buffer = await workbook.xlsx.writeBuffer()
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})

describe('buildActivitiesWorkbook', () => {
  it('crea una hoja de resumen y una hoja de detalle por actividad', () => {
    const workbook = buildActivitiesWorkbook([
      createActivity(),
      createActivity({
        id: 'act-2',
        titulo: 'Taller de básquetbol',
        taller: 'Básquetbol',
      }),
    ])

    expect(workbook.worksheets).toHaveLength(3)
    expect(workbook.worksheets[0].name).toBe('Resumen')
    expect(workbook.worksheets[1].name.startsWith('1.')).toBe(true)
    expect(workbook.worksheets[2].name.startsWith('2.')).toBe(true)

    const summaryStrings = collectStringValues(workbook.worksheets[0])
    expect(workbook.worksheets[0].getCell('A1').value).toBe(
      'RESUMEN DE ACTIVIDADES ACLE',
    )
    expect(summaryStrings).toContain('Taller de iniciación al voleibol')
    expect(summaryStrings).toContain('Taller de básquetbol')

    const summaryFormulas = collectFormulas(workbook.worksheets[0])
    expect(
      summaryFormulas.some((formula) => formula.startsWith('SUM(F')),
    ).toBe(true)

    const detailStrings = collectStringValues(workbook.worksheets[1])
    expect(detailStrings).toContain('Montaje de cancha y mesas de control.')
  })

  it('genera nombres de hoja únicos', () => {
    const workbook = buildActivitiesWorkbook([
      createActivity(),
      createActivity({ id: 'act-2' }),
      createActivity({ id: 'act-3' }),
    ])

    const names = workbook.worksheets.map((worksheet) => worksheet.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
