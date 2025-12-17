<script setup lang="ts">
  import { ref, computed, inject, shallowRef } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {
    Home,
    FileText,
    Settings,
    FolderOpen,
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    Search,
    Database,
    Upload,
    Menu,
    X,
  } from 'lucide-vue-next'
  import { useAppStore } from '@/stores'
  import type { BundleIndex } from '@/app/patchcdn/index-store'
  import VirtualScroll, { type VirtualScrollT } from '@/VirtualScroll.vue'

  interface TreeItem {
    label: string
    fullPath: string
    isFile: boolean
    isActive?: boolean
  }

  const router = useRouter()
  const route = useRoute()
  const appStore = useAppStore()

  const index = inject<BundleIndex>('bundle-index')!

  // Navigation items
  const navItems = [
    { name: 'Dashboard', icon: Home, route: '/' },
    { name: 'Data Viewer', icon: FileText, route: '/viewer' },
    { name: 'Settings', icon: Settings, route: '/settings' },
  ]

  // File tree state
  const currentDir = shallowRef('')
  const searchText = ref('')
  const searchExtension = ref('.datc64')
  const showFileTree = ref(true)

  // Watch index changes
  index.watch(() => {
    currentDir.value = ''
  })

  // Compute directory content
  const dirContent = computed(() => index.getDirContent(currentDir.value))

  // Build the tree
  const tree = computed<TreeItem[]>(() => {
    if (!index.isLoaded) return []

    if (currentDir.value === '') {
      const dirs = index.getRootDirs()
      return dirs
        .map((dirName) => ({
          label: dirName,
          fullPath: dirName,
          isFile: false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    }

    return [
      {
        label: '../',
        fullPath:
          currentDir.value.indexOf('/') === -1
            ? ''
            : currentDir.value.split('/').slice(0, -1).join('/'),
        isFile: false,
      },
      ...dirContent.value.dirs
        .map((dirName) => ({
          label: dirName.substr(currentDir.value.length + 1),
          fullPath: dirName,
          isFile: false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      ...dirContent.value.files
        .map((fileName) => ({
          label: fileName.substr(currentDir.value.length + 1),
          fullPath: fileName,
          isFile: true,
          isActive: false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  })

  // Extension filter options
  const extensionOpts = computed(() => {
    const extensions: string[] = []
    for (const entry of tree.value) {
      if (entry.isFile && entry.label.lastIndexOf('.') !== -1) {
        const ext = entry.label.slice(entry.label.lastIndexOf('.'))
        if (!extensions.includes(ext)) {
          extensions.push(ext)
        }
      }
    }
    return extensions.map((ext) => ({
      value: ext,
      active: searchExtension.value === ext,
      handleClick: () => {
        searchExtension.value = searchExtension.value !== ext ? ext : ''
      },
    }))
  })

  // Filtered tree
  const filteredTree = computed(() => {
    const term = searchText.value.toLowerCase()
    const ext = extensionOpts.value.some((opt) => opt.value === searchExtension.value)
      ? searchExtension.value
      : ''
    return tree.value.filter((item) => {
      return (
        item.label.toLowerCase().includes(term) && (item.isFile ? item.label.endsWith(ext) : true)
      )
    })
  })

  // Handle tree navigation
  async function handleTreeNav(item: TreeItem) {
    if (!item.isFile) {
      currentDir.value = item.fullPath
    } else {
      // Navigate to viewer with the file
      router.push({
        path: '/viewer',
        query: { file: item.fullPath },
      })
    }
  }

  function isActiveRoute(path: string) {
    return route.path === path
  }
</script>

<template>
  <aside
    class="flex h-full flex-col border-r border-dark-200 bg-dark-50 transition-all duration-300 dark:border-dark-700 dark:bg-dark-800/50"
    :class="appStore.sidebarCollapsed ? 'w-16' : 'w-72'"
  >
    <!-- Logo -->
    <div
      class="flex h-16 items-center justify-between border-b border-dark-200 px-4 dark:border-dark-700"
    >
      <div v-if="!appStore.sidebarCollapsed" class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Database class="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-dark-900 dark:text-dark-100">PoE DAT Studio</h1>
          <p class="text-xs text-dark-500">Data Explorer</p>
        </div>
      </div>
      <button
        class="btn-ghost rounded-lg p-2"
        :title="appStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="appStore.toggleSidebar()"
      >
        <Menu v-if="appStore.sidebarCollapsed" class="h-5 w-5" />
        <X v-else class="h-5 w-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-3">
      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.name">
          <router-link
            :to="item.route"
            :class="[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActiveRoute(item.route)
                ? 'bg-primary-600/20 text-primary-600 dark:text-primary-400'
                : 'text-dark-600 hover:bg-dark-200 hover:text-dark-900 dark:text-dark-400 dark:hover:bg-dark-700 dark:hover:text-dark-100',
            ]"
            :title="appStore.sidebarCollapsed ? item.name : undefined"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span v-if="!appStore.sidebarCollapsed">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Divider -->
    <div class="mx-3 my-2 h-px bg-dark-200 dark:bg-dark-700" />

    <!-- File Explorer (only when not collapsed) -->
    <template v-if="!appStore.sidebarCollapsed">
      <div class="flex items-center justify-between px-4 py-2">
        <h2 class="text-xs font-medium uppercase tracking-wider text-dark-500">File Explorer</h2>
        <button
          class="btn-ghost rounded p-1"
          :title="showFileTree ? 'Hide files' : 'Show files'"
          @click="showFileTree = !showFileTree"
        >
          <ChevronDown v-if="showFileTree" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>

      <template v-if="showFileTree">
        <!-- Search -->
        <div class="px-3 pb-2">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
            <input
              v-model.trim="searchText"
              type="search"
              placeholder="Search files..."
              class="input-search w-full"
            />
          </div>
        </div>

        <!-- Extension filters -->
        <div v-if="extensionOpts.length" class="flex flex-wrap gap-1 px-3 pb-2">
          <button
            v-for="opt in extensionOpts"
            :key="opt.value"
            :class="[
              'rounded px-2 py-0.5 text-xs transition-colors',
              opt.active
                ? 'bg-primary-600/30 text-primary-400 dark:text-primary-300'
                : 'bg-dark-200 text-dark-600 hover:bg-dark-300 dark:bg-dark-700 dark:text-dark-400 dark:hover:bg-dark-600',
            ]"
            @click="opt.handleClick"
          >
            {{ opt.value }}
          </button>
        </div>

        <!-- File tree -->
        <div class="flex-1 overflow-hidden">
          <div
            v-if="!index.isLoaded"
            class="flex items-center justify-center p-4 text-sm text-dark-500"
          >
            <div class="flex items-center gap-2">
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-dark-300 border-t-primary-500 dark:border-dark-600"
              />
              <span>Loading index...</span>
            </div>
          </div>

          <div
            v-else-if="!filteredTree.length"
            class="p-4 text-center text-sm italic text-dark-500"
          >
            No files found
          </div>

          <virtual-scroll v-else class="h-full" :items="filteredTree" :item-height="28">
            <template #default="{ entries }">
              <button
                v-for="entry in entries"
                :key="entry.item.fullPath"
                class="absolute flex w-full items-center gap-2 px-3 py-1 text-left text-sm text-dark-600 transition-colors hover:bg-dark-200 hover:text-dark-900 dark:text-dark-300 dark:hover:bg-dark-700 dark:hover:text-dark-100"
                :class="{
                  'bg-primary-600/20 text-primary-600 dark:text-primary-400': entry.item.isActive,
                }"
                :style="{ transform: `translateY(${entry.top}px)` }"
                @click="handleTreeNav(entry.item)"
              >
                <template v-if="!entry.item.isFile">
                  <FolderOpen v-if="entry.item.label === '../'" class="h-4 w-4 text-amber-500" />
                  <Folder v-else class="h-4 w-4 text-amber-500" />
                </template>
                <File v-else class="h-4 w-4 text-dark-400 dark:text-dark-500" />
                <span class="truncate">{{ entry.item.label }}</span>
              </button>
            </template>
          </virtual-scroll>
        </div>
      </template>
    </template>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Footer -->
    <div
      v-if="!appStore.sidebarCollapsed"
      class="border-t border-dark-200 p-4 text-xs text-dark-500 dark:border-dark-700"
    >
      <p>Version {{ $attrs['app-version'] || 'dev' }}</p>
      <a
        href="https://github.com/SnosMe/poe-dat-viewer"
        target="_blank"
        class="text-primary-500 hover:underline dark:text-primary-400"
      >
        Original by SnosMe
      </a>
    </div>
  </aside>
</template>
