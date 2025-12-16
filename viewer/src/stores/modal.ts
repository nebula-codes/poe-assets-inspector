import { defineStore } from 'pinia'
import { ref, shallowRef, type Component } from 'vue'

export interface ModalOptions {
  component: Component
  props?: Record<string, unknown>
  onClose?: () => void
}

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const currentModal = shallowRef<ModalOptions | null>(null)

  function openModal(options: ModalOptions) {
    currentModal.value = options
    isOpen.value = true
  }

  function closeModal() {
    if (currentModal.value?.onClose) {
      currentModal.value.onClose()
    }
    isOpen.value = false
    currentModal.value = null
  }

  return {
    isOpen,
    currentModal,
    openModal,
    closeModal,
  }
})
