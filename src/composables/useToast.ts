import { reactive } from 'vue'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

const state = reactive<{ items: Toast[] }>({ items: [] })
let nextId = 1

export function useToast() {
  function dismiss(id: number): void {
    const index = state.items.findIndex((toast) => toast.id === id)
    if (index >= 0) state.items.splice(index, 1)
  }

  function show(
    kind: ToastKind,
    title: string,
    message?: string,
    timeout = 4500,
  ): number {
    const id = nextId++
    state.items.push({ id, kind, title, message })
    if (timeout > 0) {
      window.setTimeout(() => dismiss(id), timeout)
    }
    return id
  }

  return {
    toasts: state.items,
    show,
    dismiss,
    success: (title: string, message?: string) => show('success', title, message),
    error: (title: string, message?: string) => show('error', title, message),
    info: (title: string, message?: string) => show('info', title, message),
    warning: (title: string, message?: string) => show('warning', title, message),
  }
}
