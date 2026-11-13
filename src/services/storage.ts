import type { Activity, ActivityFormModel } from '@/types/activity'

const ACTIVITIES_KEY = 'acle.activities.v1'
const DRAFT_KEY = 'acle.draft.v1'

export interface DraftPayload {
  form: ActivityFormModel
  activityId?: string
  savedAt: string
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode / quota exceeded). Fail silently.
  }
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.titulo === 'string' &&
    typeof candidate.responsable === 'string' &&
    Array.isArray(candidate.materiales) &&
    Array.isArray(candidate.recursosHumanos)
  )
}

const SAMPLE_ACTIVITY: Activity = {
  id: 'act-festival-acle-2025',
  titulo: 'FESTIVAL ACLE 2025',
  responsable: 'Profesor Encargado ACLE',
  taller: 'Deportes y Actividades Artísticas',
  fechaInicio: '2025-11-24',
  fechaTermino: '2025-12-07',
  horaInicio: '15:30',
  horaTermino: '18:30',
  descripcion:
    'Cierre de talleres ACLE 2025: presentaciones, muestras deportivas y artísticas con la comunidad escolar del Colegio Bautista Temuco.',
  materiales: [
    {
      id: 'mat-1',
      cantidad: 5,
      materiales: 'Balones oficiales',
      caracteristicas: 'Cuero sintético aprobado FEVOCHI',
      valorUnitario: 18000,
      fechaRequerimiento: '2025-11-20',
    },
    {
      id: 'mat-2',
      cantidad: 30,
      materiales: 'Medallas de premiación',
      caracteristicas: 'Metálicas con cinta institucional',
      valorUnitario: 2500,
      fechaRequerimiento: '2025-11-25',
    },
    {
      id: 'mat-3',
      cantidad: 2,
      materiales: 'Redes de voleibol reforzadas',
      caracteristicas: 'Malla reglamentaria con cable de acero',
      valorUnitario: 24000,
      fechaRequerimiento: '2025-11-20',
    },
  ],
  recursosHumanos: [
    {
      id: 'rh-1',
      cantidad: 1,
      recursoHumano: 'Árbitro federado',
      funcion: 'Arbitraje de partidos finales del festival',
      valorPorEvento: 45000,
      fechaRequerimiento: '2025-11-28',
    },
    {
      id: 'rh-2',
      cantidad: 2,
      recursoHumano: 'Monitores de apoyo',
      funcion: 'Control de planillas y coordinación de equipos',
      valorPorEvento: 30000,
      fechaRequerimiento: '2025-11-24',
    },
  ],
  solicitudOperaciones: 'Habilitación de gimnasio principal, tableros y graderías.',
  solicitudAudio:
    'Sistema de audio y micrófonos inalámbricos para inauguración y premiación.',
  solicitudAsistentes: '2 asistentes de apoyo logístico y primeros auxilios.',
  profesorResponsable: 'Profesor de Taller ACLE',
  coordinador: 'Coordinador ACLE Colegio Bautista',
  estado: 'finalizada',
  createdAt: '2025-11-01T10:00:00.000Z',
  updatedAt: '2025-11-01T10:00:00.000Z',
}

export function loadActivities(): Activity[] {
  const data = readJSON<unknown>(ACTIVITIES_KEY)
  if (data === null) {
    saveActivities([SAMPLE_ACTIVITY])
    return [SAMPLE_ACTIVITY]
  }
  if (!Array.isArray(data)) return []
  return data.filter(isActivity)
}

export function saveActivities(activities: Activity[]): void {
  writeJSON(ACTIVITIES_KEY, activities)
}

export function loadDraft(): DraftPayload | null {
  const data = readJSON<DraftPayload>(DRAFT_KEY)
  if (!data || typeof data !== 'object') return null
  if (!data.form || !Array.isArray(data.form.materiales)) return null
  return data
}

export function saveDraft(payload: DraftPayload): void {
  writeJSON(DRAFT_KEY, payload)
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Ignore storage failures.
  }
}
