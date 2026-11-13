<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  AlertTriangle,
  CalendarDays,
  Eraser,
  FileText,
  Info,
  Package,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BudgetSummary from '@/components/activity/BudgetSummary.vue'
import { useActivities } from '@/composables/useActivities'
import { useToast } from '@/composables/useToast'
import { activityFormSchema } from '@/utils/validation'
import {
  activityToForm,
  createEmptyActivityForm,
  createEmptyHumanResource,
  createEmptyMaterial,
  formHumanResourceLineTotal,
  formMaterialLineTotal,
  formToActivity,
  formTotals,
} from '@/utils/activityMapper'
import { formatCLP } from '@/utils/currency'
import { formatDateTimeCL } from '@/utils/date'
import {
  clearDraft,
  loadDraft,
  saveDraft as persistDraft,
  type DraftPayload,
} from '@/services/storage'
import type {
  ActivityFormModel,
  HumanResourceFormItem,
  MaterialFormItem,
} from '@/types/activity'

const route = useRoute()
const router = useRouter()
const activitiesApi = useActivities()
const toast = useToast()

const editingId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : undefined
})

const existing = editingId.value ? activitiesApi.getById(editingId.value) : null

if (editingId.value && !existing) {
  toast.error('Actividad no encontrada', 'Puede que haya sido eliminada.')
  void router.replace('/actividades')
}

const initialForm = existing ? activityToForm(existing) : createEmptyActivityForm()

const { errors, handleSubmit, isSubmitting, meta, resetForm, setValues, values } =
  useForm<ActivityFormModel>({
    validationSchema: toTypedSchema(activityFormSchema),
    initialValues: initialForm,
    validateOnMount: false,
  })

const totals = computed(() => formTotals(values))
const materialCount = computed(() => values.materiales.length)
const humanResourceCount = computed(() => values.recursosHumanos.length)

const pageHeading = computed(() =>
  existing ? 'Editar actividad' : 'Nueva actividad',
)
const pageSubtitle = computed(() =>
  existing
    ? 'Actualiza la propuesta, sus materiales y recursos humanos.'
    : 'Completa las secciones para registrar la propuesta y su presupuesto.',
)

/**
 * Flag que solo se activa al intentar guardar.
 * Los errores de validación NO se muestran al usuario
 * hasta que haya hecho clic en "Guardar" al menos una vez.
 */
const wasSubmitted = ref(false)

function getError(path: string): string | undefined {
  if (!wasSubmitted.value) return undefined
  const bag = errors.value as Record<string, string | undefined>
  return bag[path] ?? bag[path.replace(/\[(\d+)\]/g, '.$1')]
}

function materialError(
  index: number,
  field: keyof MaterialFormItem,
): string | undefined {
  return getError(`materiales[${index}].${field}`)
}

function humanResourceError(
  index: number,
  field: keyof HumanResourceFormItem,
): string | undefined {
  return getError(`recursosHumanos[${index}].${field}`)
}

function hasDraftContent(form: ActivityFormModel): boolean {
  return Boolean(
    form.responsable.trim() ||
      form.taller.trim() ||
      form.titulo.trim() ||
      form.descripcion.trim() ||
      form.materiales.some(
        (item) =>
          item.materiales.trim() ||
          item.caracteristicas.trim() ||
          item.valorUnitario.trim() !== '',
      ) ||
      form.recursosHumanos.some(
        (item) =>
          item.recursoHumano.trim() ||
          item.funcion.trim() ||
          item.valorPorEvento.trim() !== '',
      ) ||
      form.solicitudOperaciones?.trim() ||
      form.solicitudAudio.trim() ||
      form.solicitudAsistentes.trim() ||
      form.profesorResponsable.trim() ||
      form.coordinador.trim(),
  )
}

const draftCandidate = ref<DraftPayload | null>(null)
const storedDraft = loadDraft()
if (
  storedDraft &&
  hasDraftContent(storedDraft.form) &&
  (storedDraft.activityId ?? undefined) === (existing?.id ?? undefined)
) {
  draftCandidate.value = storedDraft
}

const draftSavedLabel = computed(() =>
  draftCandidate.value ? formatDateTimeCL(draftCandidate.value.savedAt) : '',
)

const isSaved = ref(false)
let autosaveTimer: number | undefined

watch(
  values,
  (current) => {
    if (!hasDraftContent(current)) return
    if (autosaveTimer) window.clearTimeout(autosaveTimer)
    autosaveTimer = window.setTimeout(() => {
      persistDraft({
        form: JSON.parse(JSON.stringify(current)) as ActivityFormModel,
        activityId: existing?.id,
        savedAt: new Date().toISOString(),
      })
    }, 1200)
  },
  { deep: true },
)

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!isSaved.value && meta.value.dirty) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  if (autosaveTimer) window.clearTimeout(autosaveTimer)
})

onBeforeRouteLeave(() => {
  if (isSaved.value || !meta.value.dirty) return true
  return window.confirm(
    'Tienes cambios sin guardar. ¿Deseas salir de todos modos?',
  )
})

function restoreDraft(): void {
  if (!draftCandidate.value) return
  setValues({
    ...createEmptyActivityForm(),
    ...draftCandidate.value.form,
  })
  draftCandidate.value = null
  toast.info('Borrador restaurado', 'Puedes continuar donde lo dejaste.')
}

function discardDraft(): void {
  clearDraft()
  draftCandidate.value = null
  toast.info('Borrador descartado')
}

function addMaterial(): void {
  values.materiales.push(createEmptyMaterial())
}

function removeMaterial(index: number): void {
  values.materiales.splice(index, 1)
}

function addHumanResource(): void {
  values.recursosHumanos.push(createEmptyHumanResource())
}

function removeHumanResource(index: number): void {
  values.recursosHumanos.splice(index, 1)
}

const submitForm = handleSubmit(
  (validated) => {
    wasSubmitted.value = true
    const activity = formToActivity(validated as ActivityFormModel, {
      id: existing?.id,
      createdAt: existing?.createdAt,
      estado: 'finalizada',
    })

    activitiesApi.saveActivity(activity)
    isSaved.value = true
    clearDraft()
    draftCandidate.value = null
    toast.success(
      existing ? 'Actividad actualizada' : 'Actividad registrada',
      'El presupuesto se guardó correctamente en este navegador.',
    )
    void router.push('/actividades')
  },
  (ctx) => {
    // Activar la visualización de errores recién al intentar guardar
    wasSubmitted.value = true
    const messages = Object.values(ctx.errors)
      .flat()
      .filter((message): message is string => typeof message === 'string')

    toast.error(
      'Revisa el formulario',
      messages[0] ?? 'Hay campos obligatorios pendientes.',
    )

    void nextTick(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      )
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstInvalid?.focus({ preventScroll: true })
    })
  },
)

function saveAsDraft(): void {
  if (!hasDraftContent(values)) {
    toast.warning(
      'Nada que guardar',
      'Agrega información antes de guardar un borrador.',
    )
    return
  }

  const activity = formToActivity(values, {
    id: existing?.id,
    createdAt: existing?.createdAt,
    estado: 'borrador',
  })

  activitiesApi.saveActivity(activity)
  isSaved.value = true
  clearDraft()
  draftCandidate.value = null
  toast.success(
    'Borrador guardado',
    'Puedes continuar editándolo desde Actividades registradas.',
  )
  void router.push('/actividades')
}

function resetAll(): void {
  if (!window.confirm('¿Limpiar todos los datos del formulario?')) return
  resetForm({ values: createEmptyActivityForm() })
  clearDraft()
  draftCandidate.value = null
  isSaved.value = false
  wasSubmitted.value = false
  toast.info('Formulario limpiado', 'Puedes comenzar una nueva propuesta.')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <BaseBadge :variant="existing ? 'brand' : 'neutral'" dot>
            {{ existing ? 'Edición' : 'Nueva propuesta' }}
          </BaseBadge>
          <span v-if="existing" class="text-xs text-slate-500">
            Actualizado {{ formatDateTimeCL(existing.updatedAt) }}
          </span>
        </div>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {{ pageHeading }}
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-500">{{ pageSubtitle }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" size="sm" @click="resetAll">
          <Eraser class="h-4 w-4" aria-hidden="true" />
          Limpiar
        </BaseButton>
      </div>
    </div>

    <div
      v-if="draftCandidate"
      class="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p class="text-sm font-semibold text-amber-900">
            Hay un borrador guardado
          </p>
          <p class="mt-0.5 text-sm text-amber-800">
            Guardado el {{ draftSavedLabel }}. ¿Quieres restaurarlo?
          </p>
        </div>
      </div>
      <div class="flex shrink-0 gap-2">
        <BaseButton size="sm" variant="outline" @click="discardDraft">
          Descartar
        </BaseButton>
        <BaseButton size="sm" @click="restoreDraft">
          <RotateCcw class="h-4 w-4" aria-hidden="true" />
          Restaurar
        </BaseButton>
      </div>
    </div>

    <form
      class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      novalidate
      @submit.prevent="submitForm"
    >
      <div class="space-y-6">
        <BaseCard
          title="A. Información general"
          subtitle="Datos del responsable y vigencia de la actividad"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <BaseInput
              v-model="values.responsable"
              label="Nombre completo del responsable"
              placeholder="Ej: María González"
              autocomplete="name"
              required
              :error="getError('responsable')"
            />
            <BaseInput
              v-model="values.taller"
              label="Taller o disciplina"
              placeholder="Ej: Voleibol"
              required
              :error="getError('taller')"
            />
            <BaseInput
              v-model="values.fechaInicio"
              label="Fecha de inicio"
              type="date"
              required
              :error="getError('fechaInicio')"
            />
            <BaseInput
              v-model="values.fechaTermino"
              label="Fecha de término"
              type="date"
              required
              :error="getError('fechaTermino')"
            />
            <BaseInput
              v-model="values.horaInicio"
              label="Hora de inicio"
              type="time"
              required
              :error="getError('horaInicio')"
            />
            <BaseInput
              v-model="values.horaTermino"
              label="Hora de término"
              type="time"
              required
              :error="getError('horaTermino')"
            />
          </div>

          <p class="field-hint mt-3 flex items-center gap-1.5">
            <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
            La fecha de término no puede ser anterior a la fecha de inicio.
          </p>
        </BaseCard>

        <BaseCard
          title="B. Información de la actividad"
          subtitle="Título y descripción de la propuesta"
        >
          <div class="space-y-4">
            <BaseInput
              v-model="values.titulo"
              label="Título de actividad"
              placeholder="Ej: Taller de iniciación al voleibol"
              :maxlength="150"
              required
              :hint="`${values.titulo.length}/150 caracteres`"
              :error="getError('titulo')"
            />
            <BaseTextarea
              v-model="values.descripcion"
              label="Descripción de la propuesta"
              placeholder="Describe los objetivos, la metodología, el contexto y los resultados esperados de la actividad."
              :rows="6"
              :maxlength="5000"
              required
              hint="Incluye objetivos, metodología y contexto de la actividad."
              :error="getError('descripcion')"
            />
          </div>
        </BaseCard>

        <BaseCard
          title="C. Presupuesto de materiales"
          subtitle="Cantidad × valor unitario. Los totales se calculan automáticamente."
        >
          <template #actions>
            <BaseButton size="sm" variant="subtle" @click="addMaterial">
              <Plus class="h-4 w-4" aria-hidden="true" />
              Agregar material
            </BaseButton>
          </template>

          <div
            v-if="values.materiales.length === 0"
            class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          >
            <Package class="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-slate-700">
              No hay materiales agregados
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Agrega al menos un material para completar el presupuesto.
            </p>
            <BaseButton class="mt-3" size="sm" @click="addMaterial">
              <Plus class="h-4 w-4" aria-hidden="true" />
              Agregar material
            </BaseButton>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(material, index) in values.materiales"
              :key="material.id"
              class="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Material {{ index + 1 }}
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  @click="removeMaterial(index)"
                >
                  <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                  Eliminar
                </button>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="material.cantidad"
                    label="Cantidad"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    required
                    :error="materialError(index, 'cantidad')"
                  />
                </div>
                <div class="lg:col-span-3">
                  <BaseInput
                    v-model="material.materiales"
                    label="Material"
                    placeholder="Ej: Balones de voleibol"
                    required
                    :error="materialError(index, 'materiales')"
                  />
                </div>
                <div class="lg:col-span-3">
                  <BaseInput
                    v-model="material.caracteristicas"
                    label="Descripción del material"
                    placeholder="Ej: N°5, cuero sintético oficial"
                    :error="materialError(index, 'caracteristicas')"
                  />
                </div>
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="material.valorUnitario"
                    label="Valor unitario (CLP)"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    placeholder="0"
                    required
                    :error="materialError(index, 'valorUnitario')"
                  />
                </div>
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="material.fechaRequerimiento"
                    label="Fecha requerimiento"
                    type="date"
                    required
                    :error="materialError(index, 'fechaRequerimiento')"
                  />
                </div>
              </div>

              <div class="mt-3 flex items-center justify-end gap-2 text-sm text-slate-600">
                <span>Valor total:</span>
                <span class="font-semibold text-slate-900">
                  {{ formatCLP(formMaterialLineTotal(material)) }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="getError('materiales')" class="field-error mt-3" role="alert">
            {{ getError('materiales') }}
          </p>

          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-500">
                {{ materialCount }} fila(s) de materiales
              </span>
              <span class="text-sm font-semibold text-slate-900">
                Subtotal materiales: {{ formatCLP(totals.materiales) }}
              </span>
            </div>
          </template>
        </BaseCard>

        <BaseCard
          title="D. Presupuesto de recursos humanos"
          subtitle="El valor por evento es el importe unitario por persona."
        >
          <template #actions>
            <BaseButton size="sm" variant="subtle" @click="addHumanResource">
              <Plus class="h-4 w-4" aria-hidden="true" />
              Agregar recurso
            </BaseButton>
          </template>

          <div
            v-if="values.recursosHumanos.length === 0"
            class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          >
            <Users class="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-slate-700">
              No hay recursos humanos agregados
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Agrega al menos un recurso para completar el presupuesto.
            </p>
            <BaseButton class="mt-3" size="sm" @click="addHumanResource">
              <Plus class="h-4 w-4" aria-hidden="true" />
              Agregar recurso
            </BaseButton>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(resource, index) in values.recursosHumanos"
              :key="resource.id"
              class="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recurso humano {{ index + 1 }}
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  @click="removeHumanResource(index)"
                >
                  <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                  Eliminar
                </button>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="resource.cantidad"
                    label="Cantidad"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    required
                    :error="humanResourceError(index, 'cantidad')"
                  />
                </div>
                <div class="lg:col-span-3">
                  <BaseInput
                    v-model="resource.recursoHumano"
                    label="Recurso humano"
                    placeholder="Ej: Monitor deportivo"
                    required
                    :error="humanResourceError(index, 'recursoHumano')"
                  />
                </div>
                <div class="lg:col-span-3">
                  <BaseInput
                    v-model="resource.funcion"
                    label="Función"
                    placeholder="Ej: Coordinación del taller"
                    required
                    :error="humanResourceError(index, 'funcion')"
                  />
                </div>
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="resource.valorPorEvento"
                    label="Valor por evento (CLP)"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    placeholder="0"
                    required
                    :error="humanResourceError(index, 'valorPorEvento')"
                  />
                </div>
                <div class="lg:col-span-2">
                  <BaseInput
                    v-model="resource.fechaRequerimiento"
                    label="Fecha requerimiento"
                    type="date"
                    required
                    :error="humanResourceError(index, 'fechaRequerimiento')"
                  />
                </div>
              </div>

              <div class="mt-3 flex items-center justify-end gap-2 text-sm text-slate-600">
                <span>Subtotal:</span>
                <span class="font-semibold text-slate-900">
                  {{ formatCLP(formHumanResourceLineTotal(resource)) }}
                </span>
              </div>
            </div>
          </div>

          <p
            v-if="getError('recursosHumanos')"
            class="field-error mt-3"
            role="alert"
          >
            {{ getError('recursosHumanos') }}
          </p>

          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-500">
                {{ humanResourceCount }} fila(s) de recursos
              </span>
              <span class="text-sm font-semibold text-slate-900">
                Subtotal recursos humanos:
                {{ formatCLP(totals.recursosHumanos) }}
              </span>
            </div>
          </template>
        </BaseCard>

        <BaseCard
          title="E. Solicitudes operativas"
          subtitle="Requerimientos de operaciones, audio y asistentes para la actividad"
        >
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <BaseTextarea
              v-model="values.solicitudOperaciones"
              label="Solicitud de operaciones"
              placeholder="Ej: Montaje de cancha, mesas, sillas y apoyo logístico."
              :rows="5"
              :maxlength="1000"
              :error="getError('solicitudOperaciones')"
            />
            <BaseTextarea
              v-model="values.solicitudAudio"
              label="Solicitud de audio"
              placeholder="Ej: Micrófono inalámbrico, parlante, 2 extensiones y conexión."
              :rows="5"
              :maxlength="1000"
              :error="getError('solicitudAudio')"
            />
            <BaseTextarea
              v-model="values.solicitudAsistentes"
              label="Solicitud de asistentes"
              placeholder="Ej: 2 asistentes para apoyo logístico y control de asistencia."
              :rows="5"
              :maxlength="1000"
              :error="getError('solicitudAsistentes')"
            />
          </div>
        </BaseCard>

        <BaseCard
          title="F. Responsables y firmas"
          subtitle="Nombres que se incluirán en el documento exportado"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BaseInput
              v-model="values.profesorResponsable"
              label="Nombre del profesor responsable"
              placeholder="Ej: Juan Pérez"
              required
              :error="getError('profesorResponsable')"
            />
            <BaseInput
              v-model="values.coordinador"
              label="Nombre del coordinador"
              placeholder="Ej: Carolina Díaz"
              required
              :error="getError('coordinador')"
            />
          </div>

          <div class="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
            <PenLine class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p class="text-xs leading-relaxed text-slate-500">
              Los espacios de firma se reservan en el Excel exportado. La
              aplicación no simula firmas reales.
            </p>
          </div>
        </BaseCard>
      </div>

      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <BudgetSummary
          :totals="totals"
          :material-count="materialCount"
          :human-resource-count="humanResourceCount"
        />

        <div class="card space-y-2 p-4">
          <BaseButton type="submit" block :loading="isSubmitting">
            <Save class="h-4 w-4" aria-hidden="true" />
            {{ existing ? 'Guardar cambios' : 'Guardar actividad' }}
          </BaseButton>
          <BaseButton variant="outline" block @click="saveAsDraft">
            <FileText class="h-4 w-4" aria-hidden="true" />
            Guardar borrador
          </BaseButton>
          <p class="text-center text-xs text-slate-500">
            Los datos se guardan en este navegador.
          </p>
        </div>

        <div class="card flex items-start gap-2 p-4">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <p class="text-xs leading-relaxed text-slate-500">
            El presupuesto total se calcula sumando los subtotales de materiales
            y recursos humanos. Todos los montos se expresan en CLP sin
            decimales.
          </p>
        </div>
      </aside>
    </form>
  </div>
</template>
