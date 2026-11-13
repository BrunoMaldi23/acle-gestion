import { describe, expect, it } from 'vitest'
import { activityFormSchema } from '@/utils/validation'
import type { ActivityFormModel } from '@/types/activity'

function validForm(): ActivityFormModel {
  return {
    responsable: 'María González',
    taller: 'Voleibol',
    fechaInicio: '2026-03-02',
    fechaTermino: '2026-05-30',
    horaInicio: '15:00',
    horaTermino: '17:00',
    titulo: 'Taller de iniciación al voleibol',
    descripcion: 'Taller orientado a estudiantes de enseñanza media.',
    materiales: [
      {
        id: 'm1',
        cantidad: '2',
        materiales: 'Balones de voleibol',
        caracteristicas: 'N°5',
        valorUnitario: '15000',
        fechaRequerimiento: '2026-03-01',
      },
    ],
    recursosHumanos: [
      {
        id: 'r1',
        cantidad: '1',
        recursoHumano: 'Monitor deportivo',
        funcion: 'Coordinación',
        valorPorEvento: '40000',
        fechaRequerimiento: '2026-03-01',
      },
    ],
    solicitudOperaciones: '',
    solicitudAudio: '',
    solicitudAsistentes: '',
    profesorResponsable: 'Juan Pérez',
    coordinador: 'Carolina Díaz',
  }
}

function issuePaths(form: ActivityFormModel): string[] {
  const result = activityFormSchema.safeParse(form)
  if (result.success) return []
  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('activityFormSchema', () => {
  it('acepta un formulario completo y válido', () => {
    const result = activityFormSchema.safeParse(validForm())
    expect(result.success).toBe(true)
  })

  it('rechaza una fecha de término anterior al inicio', () => {
    const form = validForm()
    form.fechaTermino = '2026-02-01'

    expect(issuePaths(form)).toContain('fechaTermino')
  })

  it('rechaza una hora de término no posterior en el mismo día', () => {
    const form = validForm()
    form.fechaInicio = '2026-03-02'
    form.fechaTermino = '2026-03-02'
    form.horaInicio = '15:00'
    form.horaTermino = '15:00'

    expect(issuePaths(form)).toContain('horaTermino')
  })

  it('permite una hora de término anterior si la actividad dura varios días', () => {
    const form = validForm()
    form.fechaInicio = '2026-03-02'
    form.fechaTermino = '2026-03-03'
    form.horaInicio = '15:00'
    form.horaTermino = '10:00'

    expect(activityFormSchema.safeParse(form).success).toBe(true)
  })

  it('rechaza cantidades en cero o negativas', () => {
    const form = validForm()
    form.materiales[0].cantidad = '0'
    expect(issuePaths(form)).toContain('materiales.0.cantidad')

    form.materiales[0].cantidad = '-2'
    expect(issuePaths(form)).toContain('materiales.0.cantidad')
  })

  it('rechaza montos negativos', () => {
    const form = validForm()
    form.materiales[0].valorUnitario = '-15000'
    expect(issuePaths(form)).toContain('materiales.0.valorUnitario')

    form.materiales[0].valorUnitario = 'abc'
    expect(issuePaths(form)).toContain('materiales.0.valorUnitario')
  })

  it('acepta montos con coma decimal', () => {
    const form = validForm()
    form.materiales[0].valorUnitario = '1500,50'
    expect(activityFormSchema.safeParse(form).success).toBe(true)
  })

  it('rechaza materiales sin nombre', () => {
    const form = validForm()
    form.materiales[0].materiales = '   '
    expect(issuePaths(form)).toContain('materiales.0.materiales')
  })

  it('exige al menos un material y un recurso humano', () => {
    const form = validForm()
    form.materiales = []
    form.recursosHumanos = []

    const paths = issuePaths(form)
    expect(paths).toContain('materiales')
    expect(paths).toContain('recursosHumanos')
  })

  it('rechaza fechas inválidas', () => {
    const form = validForm()
    form.fechaInicio = '2026-02-30'

    expect(issuePaths(form)).toContain('fechaInicio')
  })

  it('rechaza horas fuera de rango', () => {
    const form = validForm()
    form.horaInicio = '25:00'

    expect(issuePaths(form)).toContain('horaInicio')
  })
})
