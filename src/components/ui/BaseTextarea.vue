<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    rows?: number
    maxlength?: number
  }>(),
  {
    rows: 4,
    required: false,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
const uid = useId()
const inputId = computed(() => `field-${uid}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (props.error) ids.push(errorId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="field-label">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>

    <textarea
      :id="inputId"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
      :aria-required="required"
      class="w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      :class="
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
      "
    />

    <div class="flex items-start justify-between gap-3">
      <div class="flex-1">
        <p v-if="error" :id="errorId" class="field-error" role="alert">
          {{ error }}
        </p>
        <p v-else-if="hint" :id="hintId" class="field-hint">{{ hint }}</p>
      </div>
      <p v-if="maxlength" class="field-hint whitespace-nowrap">
        {{ model.length }}/{{ maxlength }}
      </p>
    </div>
  </div>
</template>
