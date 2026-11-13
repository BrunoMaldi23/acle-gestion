<script setup lang="ts">
import { Package, Users, Wallet } from 'lucide-vue-next'
import type { ActivityTotals } from '@/types/activity'
import { formatCLP } from '@/utils/currency'

defineProps<{
  totals: ActivityTotals
  materialCount: number
  humanResourceCount: number
}>()
</script>

<template>
  <section class="card overflow-hidden" aria-label="Resumen del presupuesto">
    <header class="border-b border-slate-200 bg-brand-50/60 px-5 py-4">
      <div class="flex items-center gap-2">
        <Wallet class="h-4 w-4 text-brand-700" aria-hidden="true" />
        <h2 class="text-sm font-semibold text-brand-900">Resumen del presupuesto</h2>
      </div>
      <p class="mt-1 text-xs text-brand-800/70">
        Montos expresados en pesos chilenos (CLP), sin decimales.
      </p>
    </header>

    <div class="space-y-3 p-5">
      <div class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <Package class="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span>Materiales</span>
          <span class="text-xs text-slate-400">({{ materialCount }})</span>
        </div>
        <span class="text-sm font-semibold text-slate-900">
          {{ formatCLP(totals.materiales) }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <Users class="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span>Recursos humanos</span>
          <span class="text-xs text-slate-400">({{ humanResourceCount }})</span>
        </div>
        <span class="text-sm font-semibold text-slate-900">
          {{ formatCLP(totals.recursosHumanos) }}
        </span>
      </div>

      <div class="border-t border-slate-200 pt-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-slate-900">Presupuesto total</span>
          <span class="text-lg font-bold text-brand-800">
            {{ formatCLP(totals.total) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
