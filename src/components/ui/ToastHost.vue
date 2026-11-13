<script setup lang="ts">
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const config = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    ringClass: 'ring-emerald-100',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-600',
    ringClass: 'ring-red-100',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    ringClass: 'ring-amber-100',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-600',
    ringClass: 'ring-brand-100',
  },
} as const
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0 sm:translate-x-2 sm:translate-y-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ring-4"
        :class="config[toast.kind].ringClass"
        role="status"
      >
        <component
          :is="config[toast.kind].icon"
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="config[toast.kind].iconClass"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-slate-900">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-0.5 text-sm text-slate-600">
            {{ toast.message }}
          </p>
        </div>
        <button
          type="button"
          class="-m-1 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar notificación"
          @click="dismiss(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
