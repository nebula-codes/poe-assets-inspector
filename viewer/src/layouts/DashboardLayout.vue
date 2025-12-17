<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { provide } from 'vue'
  import TheSidebar from '@/components/layout/TheSidebar.vue'
  import TheHeader from '@/components/layout/TheHeader.vue'
  import ModalContainer from '@/components/dialogs/ModalContainer.vue'
  import { BundleLoader } from '@/app/patchcdn/cache'
  import { BundleIndex } from '@/app/patchcdn/index-store'
  import { DatSchemasDatabase } from '@/app/dat-viewer/db'
  import { useAppStore } from '@/stores'

  const appStore = useAppStore()

  // Initialize services (from original app)
  const loader = new BundleLoader()
  const index = new BundleIndex(loader)
  const schemaDb = new DatSchemasDatabase(index)

  provide('bundle-loader', loader)
  provide('bundle-index', index)
  provide('dat-schemas', schemaDb)
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-dark-100 dark:bg-dark-900">
    <!-- Sidebar -->
    <TheSidebar />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <TheHeader />

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>

    <!-- Global Modal Container -->
    <ModalContainer />
  </div>
</template>
