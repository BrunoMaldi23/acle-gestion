import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Panel principal' },
    },
    {
      path: '/nueva',
      name: 'nueva-actividad',
      component: () => import('@/views/ActivityFormView.vue'),
      meta: { title: 'Nueva actividad' },
    },
    {
      path: '/actividades',
      name: 'actividades',
      component: () => import('@/views/ActivitiesView.vue'),
      meta: { title: 'Actividades registradas' },
    },
    {
      path: '/actividades/:id/editar',
      name: 'editar-actividad',
      component: () => import('@/views/ActivityFormView.vue'),
      meta: { title: 'Editar actividad' },
    },
    {
      path: '/presupuestos',
      name: 'presupuestos',
      component: () => import('@/views/BudgetView.vue'),
      meta: { title: 'Presupuestos' },
    },
    {
      path: '/exportacion',
      name: 'exportacion',
      component: () => import('@/views/ExportView.vue'),
      meta: { title: 'Exportación Excel' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? 'ACLE Gestión'
  document.title = `${title} · ACLE Gestión`
})

export default router
