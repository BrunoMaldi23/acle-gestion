<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    padded?: boolean
  }>(),
  {
    padded: true,
  },
)
</script>

<template>
  <section class="card overflow-hidden">
    <header
      v-if="title || $slots.actions"
      class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4"
    >
      <div class="min-w-0">
        <h2 v-if="title" class="text-base font-semibold text-slate-900">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <div :class="padded ? 'p-5' : ''">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="border-t border-slate-200 bg-slate-50/60 px-5 py-3"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
