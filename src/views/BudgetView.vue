<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  Package,
  PieChart,
  Users,
  Wallet,
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
const exportingId = ref<string | null>(null)
const exportingAll = ref(false)

const rows = computed(() =>
  activities.value
    .map((activity) => ({
      activity,
      totals: activityTotals(activity),
    }))
    .sort((a, b) => b.totals.total - a.totals.total),
)

const topRows = computed(() => rows.value.slice(0, 5))
const maxTotal = computed(() =>
  Math.max(1, ...rows.value.map((row) => row.totals.total)),
)

function percentOf(total: number): number {
  return stats.value.presupuesto > 0
    ? Math.round((total / stats.value.presupuesto) * 100)
    : 0
}

function barWidth(total: number): number {
  return Math.max(4, Math.round((total / maxTotal.value) * 100))
}

async function exportOne(activity: Activity): Promise<void> {
  exportingId.value = activity.id
  try {
    await exportActivityToExcel(activity)
    toast.success('Excel generado', `Se descargó "${activity.titulo}".`)
  } catch (error) {
    toast.error(
      'No se pudo exportar',
      error instanceof Error ? error.message : 'Intenta nuevamente.',
    )
  } finally {
    exportingId.value = null
  }
}

async function exportAll(): Promise<void> {
  if (activities.value.length === 0) {
    toast.warning('Sin actividades', 'No hay presupuestos para exportar.')
    return
  }

  exportingAll.value = true
  try {
    await exportActivitiesToExcel(activities.value)
    toast.success(
      'Libro Excel generado',
      `${activities.value.length} actividad(es) exportadas con hoja de resumen.`,
    )
  } catch (error) {
    toast.error(
      'No se pudo exportar',
      error instanceof Error ? error.message : 'Intenta nuevamente.',
    )
  } finally {
    exportingAll.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">
          Finanzas
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Presupuestos
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500">
          Consulta el detalle de materiales y recursos humanos de cada
          actividad, y su participación en el presupuesto total.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <BaseButton
          variant="outline"
          size="sm"
          :loading="exportingAll"
          :disabled="activities.length === 0"
          @click="exportAll"
        >
          <FileSpreadsheet class="h-4 w-4" aria-hidden="true" />
          Exportar resumen
        </BaseButton>
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
          <p class="text-sm font-medium text-slate-500">Presupuesto total</p>
          <span class="rounded-lg bg-brand-50 p-2 text-brand-700">
            <Wallet class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-bold text-slate-900">
          {{ formatCLP(stats.presupuesto) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          {{ stats.total }} actividad(es) registradas
        </p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Materiales</p>
          <span class="rounded-lg bg-amber-50 p-2 text-amber-700">
            <Package class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-bold text-slate-900">
          {{ formatCLP(stats.materiales) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          {{ percentOf(stats.materiales) }}% del presupuesto
        </p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Recursos humanos</p>
          <span class="rounded-lg bg-violet-50 p-2 text-violet-700">
            <Users class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-bold text-slate-900">
          {{ formatCLP(stats.recursosHumanos) }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          {{ percentOf(stats.recursosHumanos) }}% del presupuesto
        </p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Promedio por actividad</p>
          <span class="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <PieChart class="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p class="mt-3 text-2xl font-bold text-slate-900">
          {{
            formatCLP(
              stats.total > 0 ? Math.round(stats.presupuesto / stats.total) : 0,
            )
          }}
        </p>
        <p class="mt-1 text-xs text-slate-500">Presupuesto promedio</p>
      </div>
    </div>

    <div
      v-if="activities.length === 0"
      class="card p-10 text-center"
    >
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Wallet class="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 class="mt-3 text-sm font-semibold text-slate-900">
        Todavía no hay presupuestos
      </h3>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Registra una actividad con sus materiales y recursos humanos para ver el
        resumen presupuestario.
      </p>
      <RouterLink to="/nueva" class="mt-4 inline-block">
        <BaseButton size="sm">
          <FilePlus2 class="h-4 w-4" aria-hidden="true" />
          Crear actividad
        </BaseButton>
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="card overflow-hidden">
        <header class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-900">
            Detalle por actividad
          </h2>
          <p class="mt-0.5 text-sm text-slate-500">
            Ordenado de mayor a menor presupuesto total.
          </p>
        </header>

        <div class="hidden overflow-x-auto scrollbar-thin md:block">
          <table class="w-full min-w-[720px] text-sm">
            <thead class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-5 py-3">Actividad</th>
                <th class="px-5 py-3 text-right">Materiales</th>
                <th class="px-5 py-3 text-right">Recursos humanos</th>
                <th class="px-5 py-3 text-right">Total</th>
                <th class="px-5 py-3 text-right">% del total</th>
                <th class="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in rows"
                :key="row.activity.id"
                class="transition hover:bg-slate-50/70"
              >
                <td class="max-w-[280px] px-5 py-3">
                  <p class="truncate font-medium text-slate-900">
                    {{ row.activity.titulo }}
                  </p>
                  <p class="truncate text-xs text-slate-500">
                    {{ row.activity.taller }} · {{ row.activity.responsable }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-400">
                    {{ formatDateCL(row.activity.fechaInicio) }} —
                    {{ formatDateCL(row.activity.fechaTermino) }}
                  </p>
                </td>
                <td class="px-5 py-3 text-right text-slate-600">
                  {{ formatCLP(row.totals.materiales) }}
                </td>
                <td class="px-5 py-3 text-right text-slate-600">
                  {{ formatCLP(row.totals.recursosHumanos) }}
                </td>
                <td class="px-5 py-3 text-right font-semibold text-slate-900">
                  {{ formatCLP(row.totals.total) }}
                </td>
                <td class="px-5 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-brand-500"
                        :style="{ width: `${barWidth(row.totals.total)}%` }"
                      />
                    </div>
                    <span class="w-9 text-xs text-slate-500">
                      {{ percentOf(row.totals.total) }}%
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3 text-right">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    :disabled="exportingId === row.activity.id"
                    :aria-label="`Exportar ${row.activity.titulo}`"
                    @click="exportOne(row.activity)"
                  >
                    <FileDown class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-3 p-4 md:hidden">
          <div
            v-for="row in rows"
            :key="row.activity.id"
            class="rounded-xl border border-slate-200 p-4"
          >
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold text-slate-900">{{ row.activity.titulo }}</p>
              <BaseBadge
                :variant="row.activity.estado === 'borrador' ? 'draft' : 'finalized'"
                dot
              >
                {{
                  row.activity.estado === 'borrador' ? 'Borrador' : 'Finalizada'
                }}
              </BaseBadge>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              {{ row.activity.taller }} · {{ row.activity.responsable }}
            </p>

            <dl class="mt-3 space-y-1.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">Materiales</dt>
                <dd class="font-medium text-slate-700">
                  {{ formatCLP(row.totals.materiales) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Recursos humanos</dt>
                <dd class="font-medium text-slate-700">
                  {{ formatCLP(row.totals.recursosHumanos) }}
                </dd>
              </div>
              <div class="flex justify-between border-t border-slate-100 pt-1.5">
                <dt class="font-semibold text-slate-900">Total</dt>
                <dd class="font-bold text-brand-800">
                  {{ formatCLP(row.totals.total) }}
                </dd>
              </div>
            </dl>

            <div class="mt-3 flex justify-end">
              <BaseButton
                variant="outline"
                size="sm"
                :loading="exportingId === row.activity.id"
                @click="exportOne(row.activity)"
              >
                <FileDown class="h-4 w-4" aria-hidden="true" />
                Exportar
              </BaseButton>
            </div>
          </div>
        </div>
      </section>

      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section class="card p-5">
          <h2 class="text-sm font-semibold text-slate-900">
            Mayores presupuestos
          </h2>
          <p class="mt-0.5 text-xs text-slate-500">
            Comparación de las 5 actividades con mayor total.
          </p>

          <ul class="mt-4 space-y-3">
            <li v-for="(row, index) in topRows" :key="row.activity.id">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="min-w-0 truncate font-medium text-slate-700">
                  {{ index + 1 }}. {{ row.activity.titulo }}
                </span>
                <span class="shrink-0 text-slate-500">
                  {{ formatCLP(row.totals.total) }}
                </span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-brand-600 transition-all"
                  :style="{ width: `${barWidth(row.totals.total)}%` }"
                />
              </div>
            </li>
          </ul>

          <p
            v-if="topRows.length === 0"
            class="mt-4 text-sm text-slate-500"
          >
            Sin datos para mostrar.
          </p>
        </section>

        <section class="card p-5">
          <h2 class="text-sm font-semibold text-slate-900">Nota</h2>
          <p class="mt-1 text-xs leading-relaxed text-slate-500">
            Todos los montos se expresan en pesos chilenos (CLP) sin decimales.
            Los subtotales se calculan automáticamente a partir de cantidad ×
            valor unitario.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
