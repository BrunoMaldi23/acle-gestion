import { computed, ref } from 'vue'
import type { Activity } from '@/types/activity'
import { loadActivities, saveActivities } from '@/services/storage'
import { duplicateActivity } from '@/utils/activityMapper'
import { activityTotals } from '@/utils/calculations'

const activities = ref<Activity[]>(loadActivities())

function persist(): void {
  saveActivities(activities.value)
}

export function useActivities() {
  const sortedActivities = computed(() =>
    [...activities.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  const stats = computed(() => {
    let materiales = 0
    let recursosHumanos = 0

    for (const activity of activities.value) {
      const totals = activityTotals(activity)
      materiales += totals.materiales
      recursosHumanos += totals.recursosHumanos
    }

    return {
      total: activities.value.length,
      borradores: activities.value.filter((a) => a.estado === 'borrador').length,
      finalizadas: activities.value.filter((a) => a.estado === 'finalizada').length,
      materiales,
      recursosHumanos,
      presupuesto: materiales + recursosHumanos,
    }
  })

  function getById(id: string): Activity | null {
    return activities.value.find((activity) => activity.id === id) ?? null
  }

  function saveActivity(activity: Activity): Activity {
    const index = activities.value.findIndex((item) => item.id === activity.id)
    if (index >= 0) {
      activities.value[index] = activity
    } else {
      activities.value.push(activity)
    }
    persist()
    return activity
  }

  function removeActivity(id: string): void {
    activities.value = activities.value.filter((activity) => activity.id !== id)
    persist()
  }

  function duplicate(id: string): Activity | null {
    const source = getById(id)
    if (!source) return null
    const copy = duplicateActivity(source)
    activities.value.push(copy)
    persist()
    return copy
  }

  function clearAll(): void {
    activities.value = []
    persist()
  }

  return {
    activities: sortedActivities,
    stats,
    getById,
    saveActivity,
    removeActivity,
    duplicate,
    clearAll,
  }
}
