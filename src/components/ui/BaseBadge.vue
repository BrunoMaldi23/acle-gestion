<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'neutral' | 'draft' | 'finalized' | 'brand' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    dot?: boolean
  }>(),
  {
    variant: 'neutral',
    dot: false,
  },
)

const variants: Record<Variant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  draft: 'bg-amber-50 text-amber-800 ring-amber-200',
  finalized: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

const dots: Record<Variant, string> = {
  neutral: 'bg-slate-400',
  draft: 'bg-amber-500',
  finalized: 'bg-emerald-500',
  brand: 'bg-brand-600',
  danger: 'bg-red-500',
}

const classes = computed(() => [
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  variants[props.variant],
])
</script>

<template>
  <span :class="classes">
    <span
      v-if="dot"
      class="h-1.5 w-1.5 rounded-full"
      :class="dots[variant]"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>
