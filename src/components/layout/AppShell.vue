<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  ClipboardList,
  FilePlus2,
  FileSpreadsheet,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  Menu,
  Plus,
  Wallet,
  X,
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const navItems: NavItem[] = [
  { label: 'Panel principal', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'Nueva actividad', to: '/nueva', icon: FilePlus2 },
  { label: 'Actividades registradas', to: '/actividades', icon: ClipboardList },
  { label: 'Presupuestos', to: '/presupuestos', icon: Wallet },
  { label: 'Exportación Excel', to: '/exportacion', icon: FileSpreadsheet },
]

const route = useRoute()
const mobileOpen = ref(false)

const pageTitle = computed(
  () => (route.meta.title as string | undefined) ?? 'Panel principal',
)

function isNavActive(item: NavItem): boolean {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
    >
      Saltar al contenido
    </a>

    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex"
    >
      <div class="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm"
        >
          <GraduationCap class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">
            ACLE Gestión
          </p>
          <p class="truncate text-xs text-slate-500">Propuestas y presupuestos</p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        <p class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menú
        </p>
        <ul class="space-y-1">
          <li v-for="item in navItems" :key="item.to">
            <RouterLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isNavActive(item)
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              "
            >
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0"
                :class="
                  isNavActive(item)
                    ? 'text-brand-700'
                    : 'text-slate-400 group-hover:text-slate-600'
                "
                aria-hidden="true"
              />
              <span class="truncate">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="border-t border-slate-100 p-4">
        <div class="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
          <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <p class="text-xs leading-relaxed text-slate-500">
            Los datos se almacenan únicamente en este navegador.
          </p>
        </div>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"
      >
        <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            class="-ml-1 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Abrir menú de navegación"
            @click="mobileOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-semibold text-slate-900 sm:text-lg">
              {{ pageTitle }}
            </h1>
          </div>

          <RouterLink to="/nueva" class="shrink-0">
            <BaseButton size="sm">
              <Plus class="h-4 w-4" aria-hidden="true" />
              <span class="hidden sm:inline">Nueva actividad</span>
              <span class="sm:hidden">Nueva</span>
            </BaseButton>
          </RouterLink>
        </div>
      </header>

      <main
        id="main-content"
        class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <RouterView v-slot="{ Component }">
          <component :is="Component" :key="route.fullPath" />
        </RouterView>
      </main>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="fixed inset-0 z-40 lg:hidden">
          <div
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
            @click="mobileOpen = false"
          />

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
            appear
          >
            <aside
              class="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
              aria-label="Menú móvil"
            >
              <div class="flex h-16 items-center justify-between border-b border-slate-100 px-4">
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white"
                  >
                    <GraduationCap class="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">ACLE Gestión</p>
                    <p class="text-xs text-slate-500">Propuestas y presupuestos</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="-mr-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar menú"
                  @click="mobileOpen = false"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación móvil">
                <ul class="space-y-1">
                  <li v-for="item in navItems" :key="item.to">
                    <RouterLink
                      :to="item.to"
                      class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                      :class="
                        isNavActive(item)
                          ? 'bg-brand-50 text-brand-800'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      "
                    >
                      <component
                        :is="item.icon"
                        class="h-4 w-4 shrink-0"
                        :class="
                          isNavActive(item)
                            ? 'text-brand-700'
                            : 'text-slate-400'
                        "
                        aria-hidden="true"
                      />
                      {{ item.label }}
                    </RouterLink>
                  </li>
                </ul>
              </nav>

              <div class="border-t border-slate-100 p-4">
                <div class="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                  <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <p class="text-xs leading-relaxed text-slate-500">
                    Los datos se almacenan únicamente en este navegador.
                  </p>
                </div>
              </div>
            </aside>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <ToastHost />
  </div>
</template>
