<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarDays,
  Copy,
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  HardDrive,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
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

type StatusFilter = 'todas' | 'borrador' | 'finalizada'

const {
  activities,
  duplicate: duplicateActivityRecord,
  removeActivity,
} = useActivities()
const toast = useToast()

const search = ref('')
const fromDate = ref('')
const toDate = ref('')
const status = ref<StatusFilter>('todas')
const selectedIds = ref<Set<string>>(new Set())
const pendingDelete = ref<Activity | null>(null)
const exportingId = ref<string | null>(null)
const exportingBulk = ref(false)

const filteredActivities = computed(() =>
  activities.value.filter((activity) => {
    const query = search.value.trim().toLowerCase()
    const matchesSearch =
      !query ||
      activity.titulo.toLowerCase().includes(query) ||
      activity.taller.toLowerCase().includes(query)
    const matchesFrom = !fromDate.value || activity.fechaTermino >= fromDate.value
    const matchesTo = !toDate.value || activity.fechaInicio <= toDate.value
    const matchesStatus =
      status.value === 'todas' || activity.estado === status.value

    return matchesSearch && matchesFrom && matchesTo && matchesStatus
  }),
)

const selectedActivities = computed(() =>
  activities.value.filter((activity) => selectedIds.value.has(activity.id)),
)
const selectedCount = computed(() => selectedActivities.value.length)
const allVisibleSelected = computed(
  () =>
    filteredActivities.value.length > 0 &&
    filteredActivities.value.every((activity) =>
      selectedIds.value.has(activity.id),
    ),
)
const hasFilters = computed(
  () =>
    Boolean(search.value) ||
    Boolean(fromDate.value) ||
    Boolean(toDate.value) ||
    status.value !== 'todas',
)

function totalOf(activity: Activity): number {
  return activityTotals(activity).total
}

function toggleAll(): void {
  const next = new Set(selectedIds.value)
  if (allVisibleSelected.value) {
    filteredActivities.value.forEach((activity) => next.delete(activity.id))
  } else {
    filteredActivities.value.forEach((activity) => next.add(activity.id))
  }
  selectedIds.value = next
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

function clearFilters(): void {
  search.value = ''
  fromDate.value = ''
  toDate.value = ''
  status.value = 'todas'
}

function duplicateRecord(activity: Activity): void {
  const copy = duplicateActivityRecord(activity.id)
  if (copy) {
    toast.success('Actividad duplicada', `Se creó "${copy.titulo}".`)
  } else {
    toast.error('No se pudo duplicar', 'La actividad ya no está disponible.')
  }
}

function askDelete(activity: Activity): void {
  pendingDelete.value = activity
}

function confirmDelete(): void {
  if (!pendingDelete.value) return
  removeActivity(pendingDelete.value.id)
  const next = new Set(selectedIds.value)
  next.delete(pendingDelete.value.id)
  selectedIds.value = next
  toast.success(
    'Actividad eliminada',
    'El registro se eliminó de este navegador.',
  )
  pendingDelete.value = null
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
      `${list.length} actividad(es) exportadas en un solo archivo.`,
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
          Registros
        </p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Actividades registradas
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500">
          Busca, filtra, edita, duplica y exporta las propuestas ACLE guardadas
          en este navegador.
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
          <FileSpreadsheet class="h-4 w-4" aria-hidden="true" />
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

    <div class="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
      <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <p>
        Los registros se almacenan únicamente en este navegador. Exporta tus
        actividades para conservar un respaldo.
      </p>
    </div>

    <BaseCard>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label for="activity-search" class="field-label">Buscar</label>
          <div class="relative">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="activity-search"
              v-model="search"
              type="search"
              placeholder="Buscar por título o disciplina"
              class="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <BaseInput v-model="fromDate" label="Desde" type="date" />
        <BaseInput v-model="toDate" label="Hasta" type="date" />

        <div>
          <label for="status-filter" class="field-label">Estado</label>
          <select
            id="status-filter"
            v-model="status"
            class="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="todas">Todas</option>
            <option value="borrador">Borradores</option>
            <option value="finalizada">Finalizadas</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-slate-500">
          Mostrando <strong class="text-slate-700">{{ filteredActivities.length }}</strong>
          de {{ activities.length }} actividades
        </p>
        <div class="flex flex-wrap gap-2">
          <BaseButton
            v-if="hasFilters"
            variant="ghost"
            size="sm"
            @click="clearFilters"
          >
            <X class="h-4 w-4" aria-hidden="true" />
            Limpiar filtros
          </BaseButton>
          <BaseButton
            v-if="selectedCount > 0"
            variant="ghost"
            size="sm"
            @click="clearSelection"
          >
            Quitar selección
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <div
      v-if="selectedCount > 0"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"
    >
      <p class="text-sm font-medium text-brand-900">
        {{ selectedCount }} actividad(es) seleccionada(s)
      </p>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" size="sm" @click="clearSelection">
          Limpiar selección
        </BaseButton>
        <BaseButton
          size="sm"
          :loading="exportingBulk"
          @click="exportBulk(selectedActivities)"
        >
          <FileSpreadsheet class="h-4 w-4" aria-hidden="true" />
          Exportar seleccionadas
        </BaseButton>
      </div>
    </div>

    <section v-if="activities.length > 0" class="card overflow-hidden">
      <div class="hidden overflow-x-auto scrollbar-thin lg:block">
        <table class="w-full min-w-[900px] text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  :checked="allVisibleSelected"
                  aria-label="Seleccionar todas las actividades visibles"
                  @change="toggleAll"
                />
              </th>
              <th class="px-4 py-3">Actividad</th>
              <th class="px-4 py-3">Responsable</th>
              <th class="px-4 py-3">Fechas</th>
              <th class="px-4 py-3 text-right">Presupuesto</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="activity in filteredActivities"
              :key="activity.id"
              class="transition hover:bg-slate-50/70"
            >
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  :checked="selectedIds.has(activity.id)"
                  :aria-label="`Seleccionar ${activity.titulo}`"
                  @change="toggleOne(activity.id)"
                />
              </td>
              <td class="max-w-[280px] px-4 py-3">
                <p class="truncate font-medium text-slate-900">
                  {{ activity.titulo }}
                </p>
                <p class="truncate text-xs text-slate-500">{{ activity.taller }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ activity.responsable }}</td>
              <td class="px-4 py-3 text-slate-600">
                <p class="flex items-center gap-1.5 text-xs">
                  <CalendarDays class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {{ formatDateCL(activity.fechaInicio) }}
                </p>
                <p class="mt-0.5 text-xs text-slate-400">
                  hasta {{ formatDateCL(activity.fechaTermino) }}
                </p>
              </td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">
                {{ formatCLP(totalOf(activity)) }}
              </td>
              <td class="px-4 py-3">
                <BaseBadge
                  :variant="activity.estado === 'borrador' ? 'draft' : 'finalized'"
                  dot
                >
                  {{ activity.estado === 'borrador' ? 'Borrador' : 'Finalizada' }}
                </BaseBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink
                    :to="`/actividades/${activity.id}/editar`"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    :aria-label="`Editar ${activity.titulo}`"
                  >
                    <Pencil class="h-4 w-4" />
                  </RouterLink>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    :aria-label="`Duplicar ${activity.titulo}`"
                    @click="duplicateRecord(activity)"
                  >
                    <Copy class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    :disabled="exportingId === activity.id"
                    :aria-label="`Exportar ${activity.titulo}`"
                    @click="exportOne(activity)"
                  >
                    <FileDown class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    :aria-label="`Eliminar ${activity.titulo}`"
                    @click="askDelete(activity)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 p-4 lg:hidden">
        <div
          v-for="activity in filteredActivities"
          :key="activity.id"
          class="rounded-xl border border-slate-200 p-4"
        >
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-600"
              :checked="selectedIds.has(activity.id)"
              :aria-label="`Seleccionar ${activity.titulo}`"
              @change="toggleOne(activity.id)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-semibold text-slate-900">{{ activity.titulo }}</p>
                <BaseBadge
                  :variant="activity.estado === 'borrador' ? 'draft' : 'finalized'"
                  dot
                >
                  {{ activity.estado === 'borrador' ? 'Borrador' : 'Finalizada' }}
                </BaseBadge>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ activity.taller }} · {{ activity.responsable }}
              </p>
              <p class="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
                {{ formatDateCL(activity.fechaInicio) }} —
                {{ formatDateCL(activity.fechaTermino) }}
              </p>
              <p class="mt-2 text-sm font-semibold text-slate-900">
                {{ formatCLP(totalOf(activity)) }}
              </p>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
            <RouterLink :to="`/actividades/${activity.id}/editar`">
              <BaseButton variant="outline" size="sm">
                <Pencil class="h-4 w-4" aria-hidden="true" />
                Editar
              </BaseButton>
            </RouterLink>
            <BaseButton
              variant="outline"
              size="sm"
              @click="duplicateRecord(activity)"
            >
              <Copy class="h-4 w-4" aria-hidden="true" />
              Duplicar
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              :loading="exportingId === activity.id"
              @click="exportOne(activity)"
            >
              <FileDown class="h-4 w-4" aria-hidden="true" />
              Exportar
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              class="text-red-600 hover:bg-red-50"
              @click="askDelete(activity)"
            >
              <Trash2 class="h-4 w-4" aria-hidden="true" />
              Eliminar
            </BaseButton>
          </div>
        </div>
      </div>

      <div
        v-if="filteredActivities.length === 0"
        class="border-t border-slate-100 p-10 text-center"
      >
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Search class="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 class="mt-3 text-sm font-semibold text-slate-900">
          No se encontraron actividades
        </h3>
        <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Prueba con otro término de búsqueda o ajusta los filtros de fecha y
          estado.
        </p>
        <BaseButton
          v-if="hasFilters"
          variant="outline"
          size="sm"
          class="mt-4"
          @click="clearFilters"
        >
          <X class="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </BaseButton>
      </div>
    </section>

    <section v-else class="card p-10 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <FileSpreadsheet class="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 class="mt-3 text-sm font-semibold text-slate-900">
        Aún no hay actividades registradas
      </h3>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Crea tu primera propuesta ACLE para comenzar a calcular presupuestos y
        exportar documentos Excel.
      </p>
      <RouterLink to="/nueva" class="mt-4 inline-block">
        <BaseButton size="sm">
          <FilePlus2 class="h-4 w-4" aria-hidden="true" />
          Crear actividad
        </BaseButton>
      </RouterLink>
    </section>

    <BaseModal
      :open="pendingDelete !== null"
      title="Eliminar actividad"
      description="Esta acción no se puede deshacer."
      @close="pendingDelete = null"
    >
      <p class="text-sm text-slate-600">
        ¿Seguro que quieres eliminar
        <strong class="text-slate-900">{{ pendingDelete?.titulo }}</strong>?
        Se quitará de este navegador.
      </p>

      <template #footer>
        <BaseButton variant="outline" @click="pendingDelete = null">
          Cancelar
        </BaseButton>
        <BaseButton variant="danger" @click="confirmDelete">
          <Trash2 class="h-4 w-4" aria-hidden="true" />
          Eliminar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
