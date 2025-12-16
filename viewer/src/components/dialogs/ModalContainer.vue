<script setup lang="ts">
  import { X } from 'lucide-vue-next'
  import { useModalStore } from '@/stores'

  const modalStore = useModalStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalStore.isOpen && modalStore.currentModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
          @click="modalStore.closeModal()"
        />

        <!-- Modal -->
        <div class="relative z-10 mx-4 w-full max-w-2xl">
          <div class="card overflow-hidden">
            <!-- Close button -->
            <button
              class="absolute right-4 top-4 rounded-lg p-1 text-dark-400 hover:bg-dark-700 hover:text-dark-100"
              @click="modalStore.closeModal()"
            >
              <X class="h-5 w-5" />
            </button>

            <!-- Modal content -->
            <component
              :is="modalStore.currentModal.component"
              v-bind="modalStore.currentModal.props"
              @close="modalStore.closeModal()"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active .card,
  .modal-leave-active .card {
    transition: transform 0.2s ease;
  }

  .modal-enter-from .card,
  .modal-leave-to .card {
    transform: scale(0.95);
  }
</style>
