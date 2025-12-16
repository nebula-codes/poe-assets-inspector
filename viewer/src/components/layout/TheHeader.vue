<script setup lang="ts">
  import { ref, computed, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    Search,
    Bell,
    Upload,
    Download,
    Settings,
    HelpCircle,
    RefreshCw,
    FolderOpen,
    Globe,
  } from 'lucide-vue-next'
  import { useAppStore, useSettingsStore } from '@/stores'
  import type { BundleIndex } from '@/app/patchcdn/index-store'

  const route = useRoute()
  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  const index = inject<BundleIndex>('bundle-index')!

  const showImportDropdown = ref(false)
  const searchQuery = ref('')

  // Page title based on route
  const pageTitle = computed(() => {
    switch (route.path) {
      case '/':
        return 'Dashboard'
      case '/viewer':
        return 'Data Viewer'
      case '/settings':
        return 'Settings'
      default:
        return 'PoE DAT Studio'
    }
  })

  // Breadcrumb
  const breadcrumb = computed(() => {
    const parts = ['Home']
    if (route.path !== '/') {
      parts.push(pageTitle.value)
    }
    return parts
  })

  // Import handlers
  async function handleLocalImport() {
    showImportDropdown.value = false
    // Will be implemented in ViewerView
    const event = new CustomEvent('open-local-file')
    window.dispatchEvent(event)
  }

  async function handleCDNImport() {
    showImportDropdown.value = false
    const event = new CustomEvent('open-cdn-dialog')
    window.dispatchEvent(event)
  }

  function handleRefresh() {
    window.location.reload()
  }
</script>

<template>
  <header
    class="flex h-16 items-center justify-between border-b border-dark-700 bg-dark-800/30 px-6"
  >
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm">
        <template v-for="(item, index) in breadcrumb" :key="item">
          <span :class="index === breadcrumb.length - 1 ? 'text-dark-100' : 'text-dark-500'">
            {{ item }}
          </span>
          <span v-if="index < breadcrumb.length - 1" class="text-dark-600">/</span>
        </template>
      </nav>
    </div>

    <!-- Center - Search -->
    <div class="mx-8 max-w-xl flex-1">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search tables, columns, or data..."
          class="input-search w-full bg-dark-800"
        />
        <kbd
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-dark-700 px-1.5 py-0.5 text-xs text-dark-400"
        >
          ⌘K
        </kbd>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Import button with dropdown -->
      <div class="relative">
        <button
          class="btn-secondary flex items-center gap-2"
          @click="showImportDropdown = !showImportDropdown"
        >
          <Upload class="h-4 w-4" />
          <span>Import</span>
        </button>

        <!-- Dropdown -->
        <div v-if="showImportDropdown" class="dropdown right-0 mt-2 w-56" @click.stop>
          <button class="dropdown-item w-full" @click="handleLocalImport">
            <FolderOpen class="h-4 w-4" />
            <span>Open Local File</span>
          </button>
          <button class="dropdown-item w-full" @click="handleCDNImport">
            <Globe class="h-4 w-4" />
            <span>Import from Patch CDN</span>
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-2 h-6 w-px bg-dark-700" />

      <!-- Action buttons -->
      <button class="btn-icon btn-ghost" title="Refresh" @click="handleRefresh">
        <RefreshCw class="h-5 w-5" />
      </button>

      <button class="btn-icon btn-ghost" title="Help">
        <HelpCircle class="h-5 w-5" />
      </button>

      <button class="btn-icon btn-ghost relative" title="Notifications">
        <Bell class="h-5 w-5" />
        <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500" />
      </button>

      <!-- User avatar / Settings -->
      <router-link
        to="/settings"
        class="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 transition-colors hover:bg-dark-600"
        title="Settings"
      >
        <Settings class="h-4 w-4 text-dark-400" />
      </router-link>
    </div>
  </header>

  <!-- Click outside to close dropdown -->
  <div v-if="showImportDropdown" class="fixed inset-0 z-40" @click="showImportDropdown = false" />
</template>
