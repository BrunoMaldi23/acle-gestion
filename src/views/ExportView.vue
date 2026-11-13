<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CheckCircle2,
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  HardDrive,
  Layers,
  ShieldCheck,
} from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useActivities } from '@/composables/useActivities'
import { useToast } from '@/composables/useToast'
import {
  exportActivitiesToExcel,
  exportActivityToExcel,
} from '@/services/excelExportService'
import { activityTotals } from '@/utils/calculations'
import { formatCLP } from '@/utils/currency'
import { formatDateCL } from '@/utils/date'
import type { Activity } from '@/types/activity'

const { activities, stats } = useActivities()
const toast = useToast()

const selectedIds = ref<Set<string>>(new Set())
const exportingId = ref<string | null>(null)
const exportingBulk = ref(false)

const selectedActivities = computed(() =>
  activities.value.filter((activity) => selectedIds.value.has(activity.id)),
)
const selectedCount = computed(() => selectedActivities.value.length)
const allSelected = computed(
  () =>
    activities.value.length > 0 &&
    activities.value.every((activity) => selectedIds.value.has(activity.id)),
)

const exportSections = [
  {
    title: 'Encabezado oficial Colegio Bautista',
    description: 'Logo institucional de 100 años y título de presupuesto.',
  },
  {
    title: 'Información general',
    description: 'Nombre completo, taller o disciplina, fechas y horarios.',
  },
  {
    title: 'Descripción de la propuesta',
    description: 'Espacio estructurado con la justificación y alcance.',
  },
  {
    title: 'Presupuesto materiales',
    description: 'Cantidad, materiales, características técnicas, valor unitario, total y fecha.',
  },
  {
    title: 'Presupuesto recurso humano',
    description: 'Cantidad, recurso humano, función, valor por evento y fecha.',
  },
  {
    title: 'Solicitudes operativas',
    description: 'Solicitudes operaciones, solicitud a audio y solicitud a asistentes.',
  },
  {
    title: 'Firmas y pie de página',
    description: 'Firma de profesor y coordinador con cintillo oficial Cambridge.',
  },
]

function totalOf(activity: Activity): number {
  return activityTotals(activity).total
}

function toggleAll(): void {
  selectedIds.value = allSelected.value
    ? new Set()
    : new Set(activities.value.map((activity) => activity.id))
}

function toggleOne(id: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function clearSelection(): void {
  selectedIds.value = new Set()
}

async function exportOne(activity: Activity): Promise<void> {
  exportingId.value = activity.id
  try {
    await exportActivityToExcel(activity)
    toast.success(
      'Excel generado',
      `Se descargó el archivo de "${activity.titulo}".`,
    )
  } catch (error) {
    toast.error(
      'No se pudo exportar',
      error instanceof Error ? error.message : 'Intenta nuevamente.',
    )
  } finally {
    exportingId.value = null
  }
}

async function exportBulk(list: Activity[]): Promise<void> {
  if (list.length === 0) {
    toast.warning('Sin selección', 'Selecciona al menos una actividad.')
    return
  }

  exportingBulk.value = true
  try {
    await exportActivitiesToExcel(list)
    toast.success(
      'Libro Excel generado',
      `${list.length} actividad(es) exportadas con hoja de resumen y hojas de detalle.`,
    )
  } catch (error) {
    toast.error(
      'No se pudo exportar',
      error instanceof Error ? error.message : 'Intenta nuevamente.',
    )
  } finally {
    exportingBulk.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">
          Documentos
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Exportación Excel
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500">
          Genera archivos .xlsx compatibles con Microsoft Excel, con formato
          institucional, fórmulas y espacios de firma.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <BaseButton
          variant="outline"
          size="sm"
          :loading="exportingBulk"
          :disabled="activities.length === 0"
          @click="exportBulk(activities)"
        >
          <Layers class="h-4 w-4" aria-hidden="true" />
          Exportar todas
        </BaseButton>
        <RouterLink to="/nueva">
          <BaseButton size="sm">
            <FilePlus2 class="h-4 w-4" aria-hidden="true" />
            Nueva actividad
          </BaseButton>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-6">
        <section class="card overflow-hidden">
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">
                Actividades disponibles
              </h2>
              <p class="mt-0.5 text-sm text-slate-500">
                Selecciona una o varias actividades para exportarlas.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <BaseButton
                v-if="activities.length > 0"
                variant="ghost"
                size="sm"
                @click="toggleAll"
              >
                {{ allSelected ? 'Quitar todas' : 'Seleccionar todas' }}
              </BaseButton>
              <BaseButton
                v-if="selectedCount > 0"
                variant="ghost"
                size="sm"
                @click="clearSelection"
              >
                Limpiar
              </BaseButton>
            </div>
          </header>

          <div v-if="activities.length === 0" class="p-10 text-center">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <FileSpreadsheet class="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 class="mt-3 text-sm font-semibold text-slate-900">
              No hay actividades para exportar
            </h3>
            <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Crea una actividad para generar su documento Excel con presupuesto
              y firmas.
            </p>
            <RouterLink to="/nueva" class="mt-4 inline-block">
              <BaseButton size="sm">
                <FilePlus2 class="h-4 w-4" aria-hidden="true" />
                Crear actividad
              </BaseButton>
            </RouterLink>
          </div>

          <ul v-else class="divide-y divide-slate-100">
            <li
              v-for="activity in activities"
              :key="activity.id"
              class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  class="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
                  :checked="selectedIds.has(activity.id)"
                  :aria-label="`Seleccionar ${activity.titulo}`"
                  @change="toggleOne(activity.id)"
                />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-semibold text-slate-900">
                      {{ activity.titulo }}
                    </p>
                    <BaseBadge
                      :variant="activity.estado === 'borrador' ? 'draft' : 'finalized'"
                      dot
                    >
                      {{
                        activity.estado === 'borrador' ? 'Borrador' : 'Finalizada'
                      }}
                    </BaseBadge>
                  </div>
                  <p class="mt-1 truncate text-xs text-slate-500">
                    {{ activity.taller }} · {{ activity.responsable }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-400">
                    {{ formatDateCL(activity.fechaInicio) }} —
                    {{ formatDateCL(activity.fechaTermino) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 sm:justify-end">
                <span class="text-sm font-semibold text-slate-900">
                  {{ formatCLP(totalOf(activity)) }}
                </span>
                <BaseButton
                  variant="outline"
                  size="sm"
                  :loading="exportingId === activity.id"
                  @click="exportOne(activity)"
                >
                  <FileDown class="h-4 w-4" aria-hidden="true" />
                  Exportar
                </BaseButton>
              </div>
            </li>
          </ul>

          <footer
            v-if="activities.length > 0"
            class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-3"
          >
            <p class="text-sm text-slate-500">
              {{ selectedCount }} de {{ activities.length }} seleccionada(s)
            </p>
            <BaseButton
              size="sm"
              :loading="exportingBulk"
              :disabled="selectedCount === 0"
              @click="exportBulk(selectedActivities)"
            >
              <Layers class="h-4 w-4" aria-hidden="true" />
              Exportar seleccionadas
            </BaseButton>
          </footer>
        </section>

        <section class="card p-5">
          <h2 class="text-base font-semibold text-slate-900">
            Contenido del documento exportado
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Cada hoja de detalle conserva el siguiente orden de secciones.
          </p>

          <ol class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <li
              v-for="(section, index) in exportSections"
              :key="section.title"
              class="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
            >
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                {{ index + 1 }}
              </span>
              <div>
                <p class="text-sm font-medium text-slate-900">
                  {{ section.title }}
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ section.description }}
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section class="card p-5">
          <div class="flex items-center gap-2">
            <ShieldCheck class="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h2 class="text-sm font-semibold text-slate-900">
              Exportación segura
            </h2>
          </div>
          <ul class="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
            <li class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
              Archivos .xlsx reales, compatibles con Microsoft Excel.
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
              Fórmulas de Excel en subtotales y total general.
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
              Formatos CLP, fechas, bordes y celdas combinadas.
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
              Espacios de firma sin simular firmas reales.
            </li>
          </ul>
        </section>

        <section class="card p-5">
          <h2 class="text-sm font-semibold text-slate-900">Nombre del archivo</h2>
          <p class="mt-2 rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-600">
            ACLE_[titulo-actividad]_[fecha].xlsx
          </p>
          <p class="mt-2 rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-600">
            ACLE_Actividades_[fecha].xlsx
          </p>
          <p class="mt-2 text-xs leading-relaxed text-slate-500">
            El título se sanitiza para eliminar caracteres no permitidos en
            nombres de archivo.
          </p>
        </section>

        <section class="card p-5">
          <div class="flex items-start gap-2">
            <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Respaldo local
              </h2>
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                Las actividades viven únicamente en este navegador. Descarga tus
                archivos Excel para conservar un respaldo fuera de él.
              </p>
              <p class="mt-2 text-xs font-medium text-slate-600">
                {{ stats.total }} actividad(es) · {{ formatCLP(stats.presupuesto) }}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
