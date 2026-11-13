<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  FileSpreadsheet,
  HardDrive,
  Package,
  Pencil,
  Users,
  Wallet,
} from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useActivities } from '@/composables/useActivities'
import { useToast } from '@/composables/useToast'
import { exportActivityToExcel } from '@/services/excelExportService'
import { activityTotals } from '@/utils/calculations'
import { formatCLP } from '@/utils/currency'
import { formatDateCL, formatDateTimeCL } from '@/utils/date'
import type { Activity } from '@/types/activity'

const { activities, stats } = useActivities()
const toast = useToast()

const recentActivities = computed(() => activities.value.slice(0, 5))
const exportingId = ref<string | null>(null)

const materialShare = computed(() =>
  stats.value.presupuesto > 0
    ? Math.round((stats.value.materiales / stats.value.presupuesto) * 100)
    : 0,
)
const humanResourceShare = computed(() =>
  stats.value.presupuesto > 0 ? 100 - materialShare.value : 0,
)

function totalOf(activity: Activity): number {
  return activityTotals(activity).total
}

async function exportActivity(activity: Activity): Promise<void> {
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">
          Panel de control
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Gestión de actividades ACLE
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500">
          Administra propuestas, materiales, recursos humanos y presupuestos
          desde un solo lugar.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <RouterLink to="/actividades">
          <BaseButton variant="outline" size="sm">
            <ClipboardList class="h-4 w-4" aria-hidden="true" />
            Ver actividades
          </BaseButton>
        </RouterLink>
        <RouterLink to="/nueva">
          <BaseButton size="sm">
            <FilePlus2 class="h-4 w-4" aria-hidden="true" />
            Nueva actividad
          </BaseButton>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Actividades</p>
          <span class="rounded-lg bg-brand-50 p-2 text-brand-700">
            <ClipboardList class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-900">{{ stats.total }}</p>
        <p class="mt-1 text-xs text-slate-500">
          {{ stats.finalizadas }} finalizadas · {{ stats.borradores }} borradores
        </p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Presupuesto total</p>
          <span class="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <Wallet class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-900">
          {{ formatCLP(stats.presupuesto) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          Materiales + recursos humanos
        </p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Materiales</p>
          <span class="rounded-lg bg-amber-50 p-2 text-amber-700">
            <Package class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-900">
          {{ formatCLP(stats.materiales) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">Subtotal de materiales</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Recursos humanos</p>
          <span class="rounded-lg bg-violet-50 p-2 text-violet-700">
            <Users class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-3xl font-bold text-slate-900">
          {{ formatCLP(stats.recursosHumanos) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">Subtotal de recursos humanos</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="card overflow-hidden">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              Actividades recientes
            </h2>
            <p class="mt-0.5 text-sm text-slate-500">
              Últimos registros guardados en este navegador.
            </p>
          </div>
          <RouterLink
            v-if="activities.length > 0"
            to="/actividades"
            class="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Ver todas
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
        </header>

        <div v-if="recentActivities.length === 0" class="p-10 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <ClipboardList class="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 class="mt-3 text-sm font-semibold text-slate-900">
            Aún no hay actividades registradas
          </h3>
          <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Crea tu primera propuesta ACLE para comenzar a calcular presupuestos
            y exportar documentos Excel.
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
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-semibold text-slate-900">
                  {{ activity.titulo }}
                </p>
                <BaseBadge
                  :variant="activity.estado === 'borrador' ? 'draft' : 'finalized'"
                  dot
                >
                  {{ activity.estado === 'borrador' ? 'Borrador' : 'Finalizada' }}
                </BaseBadge>
              </div>
              <p class="mt-1 truncate text-xs text-slate-500">
                {{ activity.taller }} · {{ activity.responsable }}
              </p>
              <p class="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
                {{ formatDateCL(activity.fechaInicio) }} —
                {{ formatDateCL(activity.fechaTermino) }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-3 sm:justify-end">
              <div class="text-right">
                <p class="text-sm font-semibold text-slate-900">
                  {{ formatCLP(totalOf(activity)) }}
                </p>
                <p class="text-[11px] text-slate-400">
                  {{ formatDateTimeCL(activity.updatedAt) }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <RouterLink
                  :to="`/actividades/${activity.id}/editar`"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  :aria-label="`Editar ${activity.titulo}`"
                >
                  <Pencil class="h-4 w-4" />
                </RouterLink>
                <button
                  type="button"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  :disabled="exportingId === activity.id"
                  :aria-label="`Exportar ${activity.titulo}`"
                  @click="exportActivity(activity)"
                >
                  <FileSpreadsheet class="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <aside class="space-y-4">
        <section class="card p-5">
          <h2 class="text-sm font-semibold text-slate-900">
            Distribución del presupuesto
          </h2>
          <p class="mt-0.5 text-xs text-slate-500">
            Participación de cada categoría sobre el total.
          </p>

          <div class="mt-4 space-y-4">
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600">Materiales</span>
                <span class="text-slate-500">{{ materialShare }}%</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-amber-500 transition-all"
                  :style="{ width: `${materialShare}%` }"
                />
              </div>
              <p class="mt-1 text-xs text-slate-400">
                {{ formatCLP(stats.materiales) }}
              </p>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600">Recursos humanos</span>
                <span class="text-slate-500">{{ humanResourceShare }}%</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-violet-500 transition-all"
                  :style="{ width: `${humanResourceShare}%` }"
                />
              </div>
              <p class="mt-1 text-xs text-slate-400">
                {{ formatCLP(stats.recursosHumanos) }}
              </p>
            </div>
          </div>

          <div class="mt-4 border-t border-slate-200 pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-900">Total</span>
              <span class="text-base font-bold text-brand-800">
                {{ formatCLP(stats.presupuesto) }}
              </span>
            </div>
          </div>
        </section>

        <section class="card p-5">
          <div class="flex items-start gap-2">
            <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Almacenamiento local
              </h2>
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                Las actividades se guardan únicamente en este navegador. Si
                borras los datos del navegador, perderás los registros. Exporta
                tus actividades para respaldarlas.
              </p>
              <RouterLink to="/exportacion" class="mt-2 inline-block">
                <BaseButton variant="outline" size="sm">
                  <FileSpreadsheet class="h-4 w-4" aria-hidden="true" />
                  Ir a exportación
                </BaseButton>
              </RouterLink>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
