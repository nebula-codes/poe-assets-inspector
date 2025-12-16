<script setup lang="ts">
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    FileText,
    Database,
    FolderOpen,
    Clock,
    Layers,
    ArrowRight,
    Globe,
    HardDrive,
  } from 'lucide-vue-next'
  import type { BundleIndex } from '@/app/patchcdn/index-store'
  import { useModalStore } from '@/stores'
  import CdnImportDialog from '@/components/dialogs/CdnImportDialog.vue'

  const router = useRouter()
  const index = inject<BundleIndex>('bundle-index')!
  const modalStore = useModalStore()

  // Stats
  const stats = computed(() => {
    if (!index.isLoaded) return null

    const rootDirs = index.getRootDirs()
    let totalFiles = 0
    let datFiles = 0

    // Count files (simplified)
    for (const dir of rootDirs) {
      const content = index.getDirContent(dir)
      totalFiles += content.files.length
      datFiles += content.files.filter((f) => f.endsWith('.datc64')).length
    }

    return {
      totalTables: datFiles,
      totalFiles,
      rootFolders: rootDirs.length,
    }
  })

  // Recent files (mock for now - could be stored in localStorage)
  const recentFiles = ref<{ name: string; path: string; date: string }[]>([])

  // File input ref for local file opening
  const fileInputRef = ref<HTMLInputElement | null>(null)

  function openLocalFile() {
    fileInputRef.value?.click()
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files?.length) {
      // Navigate to viewer with the file
      router.push('/viewer')
      // Dispatch event to open the file in viewer
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-local-files', { detail: input.files }))
      }, 100)
    }
  }

  function openCdnDialog() {
    modalStore.openModal({
      component: CdnImportDialog,
    })
  }

  // Quick actions
  const quickActions = [
    {
      title: 'Open Local File',
      description: 'Import .datc64 file from your computer',
      icon: FolderOpen,
      color: 'bg-blue-600/20 text-blue-400',
      action: openLocalFile,
    },
    {
      title: 'Import from CDN',
      description: 'Download files from PoE patch servers',
      icon: Globe,
      color: 'bg-green-600/20 text-green-400',
      action: openCdnDialog,
    },
    {
      title: 'Browse All Tables',
      description: 'Explore the complete data structure',
      icon: Database,
      color: 'bg-purple-600/20 text-purple-400',
      action: () => router.push('/viewer'),
    },
  ]

  // Stats cards
  const statCards = computed(() => [
    {
      title: 'Data Tables',
      value: stats.value?.totalTables ?? '-',
      icon: FileText,
      color: 'text-primary-400',
      bgColor: 'bg-primary-600/10',
    },
    {
      title: 'Total Files',
      value: stats.value?.totalFiles ?? '-',
      icon: Layers,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/10',
    },
    {
      title: 'Root Folders',
      value: stats.value?.rootFolders ?? '-',
      icon: FolderOpen,
      color: 'text-amber-400',
      bgColor: 'bg-amber-600/10',
    },
    {
      title: 'Index Status',
      value: index.isLoaded ? 'Loaded' : 'Loading...',
      icon: HardDrive,
      color: index.isLoaded ? 'text-emerald-400' : 'text-amber-400',
      bgColor: index.isLoaded ? 'bg-emerald-600/10' : 'bg-amber-600/10',
    },
  ])
</script>

<template>
  <div class="space-y-6">
    <!-- Hidden file input for local file opening -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".datc64,.dat,.dat64"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Welcome Section -->
    <div class="card">
      <div class="flex items-center justify-between p-6">
        <div>
          <h1 class="text-2xl font-semibold text-dark-100">Welcome to PoE DAT Studio</h1>
          <p class="mt-1 text-dark-400">Explore and analyze Path of Exile data files with ease</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-primary" @click="router.push('/viewer')">
            <FileText class="h-4 w-4" />
            Open Viewer
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="stat in statCards" :key="stat.title" class="card p-6">
        <div class="flex items-center gap-4">
          <div :class="['rounded-xl p-3', stat.bgColor]">
            <component :is="stat.icon" :class="['h-6 w-6', stat.color]" />
          </div>
          <div>
            <p class="text-sm text-dark-400">{{ stat.title }}</p>
            <p class="text-2xl font-semibold text-dark-100">{{ stat.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">Quick Actions</h2>
      </div>
      <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <button
          v-for="action in quickActions"
          :key="action.title"
          class="group flex items-start gap-4 rounded-xl border border-dark-700 bg-dark-800/50 p-4 text-left transition-all hover:border-dark-600 hover:bg-dark-700/50"
          @click="action.action"
        >
          <div :class="['rounded-lg p-2.5', action.color]">
            <component :is="action.icon" class="h-5 w-5" />
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-dark-100 group-hover:text-primary-400">
              {{ action.title }}
            </h3>
            <p class="mt-1 text-sm text-dark-500">{{ action.description }}</p>
          </div>
          <ArrowRight
            class="h-5 w-5 text-dark-600 transition-transform group-hover:translate-x-1 group-hover:text-dark-400"
          />
        </button>
      </div>
    </div>

    <!-- Recent Files & Info -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Recent Files -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-dark-100">Recent Files</h2>
          <button class="text-sm text-primary-400 hover:underline">View All</button>
        </div>
        <div class="p-6">
          <div
            v-if="!recentFiles.length"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <Clock class="h-12 w-12 text-dark-600" />
            <p class="mt-4 text-dark-400">No recent files</p>
            <p class="text-sm text-dark-500">Files you open will appear here</p>
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="file in recentFiles"
              :key="file.path"
              class="flex items-center justify-between rounded-lg p-3 hover:bg-dark-700/50"
            >
              <div class="flex items-center gap-3">
                <FileText class="h-5 w-5 text-dark-500" />
                <div>
                  <p class="text-sm font-medium text-dark-200">{{ file.name }}</p>
                  <p class="text-xs text-dark-500">{{ file.path }}</p>
                </div>
              </div>
              <span class="text-xs text-dark-500">{{ file.date }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Getting Started -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-dark-100">Getting Started</h2>
        </div>
        <div class="p-6">
          <ul class="space-y-4">
            <li class="flex gap-4">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-sm font-medium text-primary-400"
              >
                1
              </div>
              <div>
                <h3 class="font-medium text-dark-200">Import Data Files</h3>
                <p class="text-sm text-dark-500">
                  Load .datc64 files from your computer or import directly from PoE patch servers
                </p>
              </div>
            </li>
            <li class="flex gap-4">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-sm font-medium text-primary-400"
              >
                2
              </div>
              <div>
                <h3 class="font-medium text-dark-200">Browse & Analyze</h3>
                <p class="text-sm text-dark-500">
                  Use the file explorer to navigate through the data structure and open tables
                </p>
              </div>
            </li>
            <li class="flex gap-4">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-sm font-medium text-primary-400"
              >
                3
              </div>
              <div>
                <h3 class="font-medium text-dark-200">Export Data</h3>
                <p class="text-sm text-dark-500">
                  Export analyzed data in various formats for further processing
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
