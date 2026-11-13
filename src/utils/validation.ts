import { z } from 'zod'
import { isValidISODate, isValidTime } from './date'

const requiredText = (message: string, max: number, maxMessage: string) =>
  z.string().trim().min(1, message).max(max, maxMessage)

const positiveIntegerString = (label: string) =>
  z
    .string()
    .min(1, `Ingresa ${label}`)
    .refine((value) => /^\d+$/.test(value.trim()), 'Debe ser un número entero')
    .refine((value) => Number(value) > 0, 'Debe ser mayor que cero')

const nonNegativeAmountString = (label: string) =>
  z
    .string()
    .min(1, `Ingresa ${label}`)
    .refine((value) => {
      const normalized = value.trim().replace(/,/g, '.')
      const parsed = Number(normalized)
      return normalized !== '' && Number.isFinite(parsed) && parsed >= 0
    }, 'Ingresa un monto válido (no negativo)')

export const materialFormSchema = z.object({
  id: z.string().min(1),
  cantidad: positiveIntegerString('la cantidad'),
  materiales: requiredText(
    'Describe el material',
    120,
    'Máximo 120 caracteres',
  ),
  caracteristicas: z
    .string()
    .trim()
    .max(300, 'Máximo 300 caracteres'),
  valorUnitario: nonNegativeAmountString('el valor unitario'),
  fechaRequerimiento: z
    .string()
    .min(1, 'Selecciona la fecha del requerimiento')
    .refine(isValidISODate, 'Fecha inválida'),
})

export const humanResourceFormSchema = z.object({
  id: z.string().min(1),
  cantidad: positiveIntegerString('la cantidad'),
  recursoHumano: requiredText(
    'Describe el recurso humano',
    120,
    'Máximo 120 caracteres',
  ),
  funcion: requiredText('Describe la función', 120, 'Máximo 120 caracteres'),
  valorPorEvento: nonNegativeAmountString('el valor por evento'),
  fechaRequerimiento: z
    .string()
    .min(1, 'Selecciona la fecha del requerimiento')
    .refine(isValidISODate, 'Fecha inválida'),
})

export const activityFormSchema = z
  .object({
    responsable: requiredText(
      'Ingresa el nombre del responsable',
      120,
      'Máximo 120 caracteres',
    ),
    taller: requiredText(
      'Ingresa el taller o disciplina',
      120,
      'Máximo 120 caracteres',
    ),
    fechaInicio: z
      .string()
      .min(1, 'Selecciona la fecha de inicio')
      .refine(isValidISODate, 'Fecha inválida'),
    fechaTermino: z
      .string()
      .min(1, 'Selecciona la fecha de término')
      .refine(isValidISODate, 'Fecha inválida'),
    horaInicio: z
      .string()
      .min(1, 'Selecciona la hora de inicio')
      .refine(isValidTime, 'Hora inválida'),
    horaTermino: z
      .string()
      .min(1, 'Selecciona la hora de término')
      .refine(isValidTime, 'Hora inválida'),
    titulo: requiredText(
      'Ingresa el título de la actividad',
      150,
      'Máximo 150 caracteres',
    ),
    descripcion: requiredText(
      'Ingresa la descripción de la propuesta',
      5000,
      'Máximo 5000 caracteres',
    ),
    materiales: z
      .array(materialFormSchema)
      .min(1, 'Agrega al menos un material'),
    recursosHumanos: z
      .array(humanResourceFormSchema)
      .min(1, 'Agrega al menos un recurso humano'),
    solicitudOperaciones: z.string().max(1000, 'Máximo 1000 caracteres'),
    solicitudAudio: z.string().max(1000, 'Máximo 1000 caracteres'),
    solicitudAsistentes: z.string().max(1000, 'Máximo 1000 caracteres'),
    profesorResponsable: requiredText(
      'Ingresa el nombre del profesor responsable',
      120,
      'Máximo 120 caracteres',
    ),
    coordinador: requiredText(
      'Ingresa el nombre del coordinador',
      120,
      'Máximo 120 caracteres',
    ),
  })
  .superRefine((data, ctx) => {
    if (
      isValidISODate(data.fechaInicio) &&
      isValidISODate(data.fechaTermino) &&
      data.fechaTermino < data.fechaInicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fechaTermino'],
        message:
          'La fecha de término no puede ser anterior a la fecha de inicio',
      })
    }

    if (
      data.fechaInicio === data.fechaTermino &&
      isValidTime(data.horaInicio) &&
      isValidTime(data.horaTermino) &&
      data.horaTermino <= data.horaInicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['horaTermino'],
        message: 'La hora de término debe ser posterior a la hora de inicio',
      })
    }
  })

export type ActivityFormValues = z.infer<typeof activityFormSchema>
