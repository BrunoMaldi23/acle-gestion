import type {
  Activity,
  ActivityFormModel,
  ActivityTotals,
  HumanResourceFormItem,
  HumanResourceItem,
  MaterialFormItem,
  MaterialItem,
} from '@/types/activity'
import { createId } from '@/utils/id'
import { toSafeNumber } from '@/utils/currency'
import { todayISO } from '@/utils/date'

export function createEmptyMaterial(): MaterialFormItem {
  return {
    id: createId('mat'),
    cantidad: '1',
    materiales: '',
    caracteristicas: '',
    valorUnitario: '',
    fechaRequerimiento: todayISO(),
  }
}

export function createEmptyHumanResource(): HumanResourceFormItem {
  return {
    id: createId('rh'),
    cantidad: '1',
    recursoHumano: '',
    funcion: '',
    valorPorEvento: '',
    fechaRequerimiento: todayISO(),
  }
}

export function createEmptyActivityForm(): ActivityFormModel {
  const today = todayISO()
  return {
    responsable: '',
    taller: '',
    fechaInicio: today,
    fechaTermino: today,
    horaInicio: '',
    horaTermino: '',
    titulo: '',
    descripcion: '',
    materiales: [createEmptyMaterial()],
    recursosHumanos: [createEmptyHumanResource()],
    solicitudOperaciones: '',
    solicitudAudio: '',
    solicitudAsistentes: '',
    profesorResponsable: '',
    coordinador: '',
  }
}

export function activityToForm(activity: Activity): ActivityFormModel {
  return {
    responsable: activity.responsable,
    taller: activity.taller,
    fechaInicio: activity.fechaInicio,
    fechaTermino: activity.fechaTermino,
    horaInicio: activity.horaInicio,
    horaTermino: activity.horaTermino,
    titulo: activity.titulo,
    descripcion: activity.descripcion,
    materiales: activity.materiales.map((item) => ({
      id: item.id,
      cantidad: String(item.cantidad),
      materiales: item.materiales,
      caracteristicas: item.caracteristicas,
      valorUnitario: String(item.valorUnitario),
      fechaRequerimiento: item.fechaRequerimiento,
    })),
    recursosHumanos: activity.recursosHumanos.map((item) => ({
      id: item.id,
      cantidad: String(item.cantidad),
      recursoHumano: item.recursoHumano,
      funcion: item.funcion,
      valorPorEvento: String(item.valorPorEvento),
      fechaRequerimiento: item.fechaRequerimiento,
    })),
    solicitudOperaciones: activity.solicitudOperaciones ?? '',
    solicitudAudio: activity.solicitudAudio,
    solicitudAsistentes: activity.solicitudAsistentes,
    profesorResponsable: activity.profesorResponsable,
    coordinador: activity.coordinador,
  }
}

function mapMaterial(item: MaterialFormItem): MaterialItem {
  return {
    id: item.id,
    cantidad: Math.max(0, Math.trunc(toSafeNumber(item.cantidad))),
    materiales: item.materiales.trim(),
    caracteristicas: item.caracteristicas.trim(),
    valorUnitario: Math.max(0, toSafeNumber(item.valorUnitario)),
    fechaRequerimiento: item.fechaRequerimiento,
  }
}

function mapHumanResource(item: HumanResourceFormItem): HumanResourceItem {
  return {
    id: item.id,
    cantidad: Math.max(0, Math.trunc(toSafeNumber(item.cantidad))),
    recursoHumano: item.recursoHumano.trim(),
    funcion: item.funcion.trim(),
    valorPorEvento: Math.max(0, toSafeNumber(item.valorPorEvento)),
    fechaRequerimiento: item.fechaRequerimiento,
  }
}

export interface FormToActivityOptions {
  id?: string
  estado?: Activity['estado']
  createdAt?: string
}

export function formToActivity(
  form: ActivityFormModel,
  options: FormToActivityOptions = {},
): Activity {
  const now = new Date().toISOString()
  return {
    id: options.id ?? createId('act'),
    responsable: form.responsable.trim(),
    taller: form.taller.trim(),
    fechaInicio: form.fechaInicio,
    fechaTermino: form.fechaTermino,
    horaInicio: form.horaInicio,
    horaTermino: form.horaTermino,
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    materiales: form.materiales.map(mapMaterial),
    recursosHumanos: form.recursosHumanos.map(mapHumanResource),
    solicitudOperaciones: form.solicitudOperaciones.trim(),
    solicitudAudio: form.solicitudAudio.trim(),
    solicitudAsistentes: form.solicitudAsistentes.trim(),
    profesorResponsable: form.profesorResponsable.trim(),
    coordinador: form.coordinador.trim(),
    estado: options.estado ?? 'finalizada',
    createdAt: options.createdAt ?? now,
    updatedAt: now,
  }
}

export function duplicateActivity(activity: Activity): Activity {
  const now = new Date().toISOString()
  return {
    ...activity,
    id: createId('act'),
    titulo: `${activity.titulo} (copia)`.slice(0, 150),
    materiales: activity.materiales.map((item) => ({
      ...item,
      id: createId('mat'),
    })),
    recursosHumanos: activity.recursosHumanos.map((item) => ({
      ...item,
      id: createId('rh'),
    })),
    estado: 'borrador',
    createdAt: now,
    updatedAt: now,
  }
}

export function formMaterialLineTotal(item: MaterialFormItem): number {
  const cantidad = Math.max(0, Math.trunc(toSafeNumber(item.cantidad)))
  const valorUnitario = Math.max(0, toSafeNumber(item.valorUnitario))
  return Math.round(cantidad * valorUnitario)
}

export function formHumanResourceLineTotal(item: HumanResourceFormItem): number {
  const cantidad = Math.max(0, Math.trunc(toSafeNumber(item.cantidad)))
  const valorPorEvento = Math.max(0, toSafeNumber(item.valorPorEvento))
  return Math.round(cantidad * valorPorEvento)
}

export function formTotals(form: ActivityFormModel): ActivityTotals {
  const materiales = form.materiales.reduce(
    (total, item) => total + formMaterialLineTotal(item),
    0,
  )
  const recursosHumanos = form.recursosHumanos.reduce(
    (total, item) => total + formHumanResourceLineTotal(item),
    0,
  )
  return {
    materiales,
    recursosHumanos,
    total: materiales + recursosHumanos,
  }
}
