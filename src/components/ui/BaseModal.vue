<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

type ModalSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: ModalSize
  }>(),
  {
    size: 'md',
  },
)

const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
let previousOverflow = ''

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

function close(): void {
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  async (open) => {
    if (typeof document === 'undefined') return

    if (open) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      panel.value
        ?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        ?.focus()
    } else {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousOverflow
    document.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      >
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />

        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="relative w-full rounded-2xl bg-white shadow-xl"
          :class="sizes[size]"
        >
          <div
            class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"
          >
            <div>
              <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-sm text-slate-500">
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              class="-m-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
              @click="close"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="px-5 py-4">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
