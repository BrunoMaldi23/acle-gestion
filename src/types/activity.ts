export type ActivityStatus = 'borrador' | 'finalizada'

export interface MaterialItem {
  id: string
  cantidad: number
  materiales: string
  caracteristicas: string
  valorUnitario: number
  fechaRequerimiento: string
}

export interface HumanResourceItem {
  id: string
  cantidad: number
  recursoHumano: string
  funcion: string
  valorPorEvento: number
  fechaRequerimiento: string
}

export interface Activity {
  id: string
  responsable: string
  taller: string
  fechaInicio: string
  fechaTermino: string
  horaInicio: string
  horaTermino: string
  titulo: string
  descripcion: string
  materiales: MaterialItem[]
  recursosHumanos: HumanResourceItem[]
  solicitudOperaciones: string
  solicitudAudio: string
  solicitudAsistentes: string
  profesorResponsable: string
  coordinador: string
  estado: ActivityStatus
  createdAt: string
  updatedAt: string
}

export interface ActivityTotals {
  materiales: number
  recursosHumanos: number
  total: number
}

export interface MaterialFormItem {
  id: string
  cantidad: string
  materiales: string
  caracteristicas: string
  valorUnitario: string
  fechaRequerimiento: string
}

export interface HumanResourceFormItem {
  id: string
  cantidad: string
  recursoHumano: string
  funcion: string
  valorPorEvento: string
  fechaRequerimiento: string
}

export interface ActivityFormModel {
  responsable: string
  taller: string
  fechaInicio: string
  fechaTermino: string
  horaInicio: string
  horaTermino: string
  titulo: string
  descripcion: string
  materiales: MaterialFormItem[]
  recursosHumanos: HumanResourceFormItem[]
  solicitudOperaciones: string
  solicitudAudio: string
  solicitudAsistentes: string
  profesorResponsable: string
  coordinador: string
}
