<script setup lang="ts">
  import { ref, computed, inject, watch, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Search, Settings, HelpCircle, RefreshCw, File, Folder, X } from 'lucide-vue-next'
  import { useAppStore, useSettingsStore } from '@/stores'
  import type { BundleIndex } from '@/app/patchcdn/index-store'

  const route = useRoute()
  const router = useRouter()
  const appStore = useAppStore()
  const settingsStore = useSettingsStore()

  const index = inject<BundleIndex>('bundle-index')!

  const searchQuery = ref('')
  const searchInputRef = ref<HTMLInputElement | null>(null)
  const showSearchResults = ref(false)
  const selectedResultIndex = ref(0)
  const isIndexing = ref(false)
  const indexingProgress = ref('')

  // Cache for all files (built lazily when user searches)
  const allFiles = ref<string[]>([])
  const allDirs = ref<string[]>([])
  const hasBuiltIndex = ref(false)

  // Build file index lazily and non-blocking
  async function buildFileIndexLazy() {
    if (!index.isLoaded || hasBuiltIndex.value || isIndexing.value) return

    isIndexing.value = true
    const files: string[] = []
    const dirs: string[] = []
    const visited = new Set<string>()
    const queue: string[] = []

    // Get root directories
    const rootDirs = index.getRootDirs()
    queue.push(...rootDirs)

    // Process in batches to avoid blocking UI
    const BATCH_SIZE = 50
    let processed = 0

    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE)

      for (const dirPath of batch) {
        if (visited.has(dirPath)) continue
        visited.add(dirPath)

        try {
          const content = index.getDirContent(dirPath)
          dirs.push(...content.dirs)
          files.push(...content.files)
          queue.push(...content.dirs)
        } catch (e) {
          // Skip inaccessible directories
        }
      }

      processed += batch.length
      indexingProgress.value = `Indexed ${files.length.toLocaleString()} files...`

      // Yield to UI thread
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    allFiles.value = files
    allDirs.value = dirs
    hasBuiltIndex.value = true
    isIndexing.value = false
    indexingProgress.value = ''
  }

  // Reset index when bundle changes
  index.watch(() => {
    hasBuiltIndex.value = false
    allFiles.value = []
    allDirs.value = []
  })

  // Search result types
  interface SearchResult {
    type: 'file' | 'dir'
    path: string
    name: string
  }

  // Search results for files and directories
  const searchResults = computed<SearchResult[]>(() => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query || query.length < 2) return []

    const results: SearchResult[] = []
    const maxResults = 50

    // Search file names in index
    for (const filePath of allFiles.value) {
      if (results.length >= maxResults) break
      const name = filePath.split('/').pop() || filePath
      if (name.toLowerCase().includes(query) || filePath.toLowerCase().includes(query)) {
        results.push({ type: 'file', path: filePath, name })
      }
    }

    // Search directories
    for (const dirPath of allDirs.value) {
      if (results.length >= maxResults) break
      const name = dirPath.split('/').pop() || dirPath
      if (name.toLowerCase().includes(query) || dirPath.toLowerCase().includes(query)) {
        results.push({ type: 'dir', path: dirPath, name })
      }
    }

    return results
  })

  // Handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent) {
    if (!showSearchResults.value || searchResults.value.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedResultIndex.value = Math.min(
        selectedResultIndex.value + 1,
        searchResults.value.length - 1
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedResultIndex.value = Math.max(selectedResultIndex.value - 1, 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectResult(searchResults.value[selectedResultIndex.value])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeSearch()
    }
  }

  // Global keyboard shortcut for search
  function handleGlobalKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchInputRef.value?.focus()
      showSearchResults.value = true
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown)
  })

  // Select a search result
  function selectResult(result: SearchResult) {
    if (result.type === 'file') {
      router.push({
        path: '/viewer',
        query: { file: result.path },
      })
    } else {
      // Directory - navigate to viewer with dir context
      router.push({
        path: '/viewer',
        query: { dir: result.path },
      })
    }
    closeSearch()
  }

  function closeSearch() {
    showSearchResults.value = false
    searchQuery.value = ''
    selectedResultIndex.value = 0
  }

  function handleSearchFocus() {
    showSearchResults.value = true
    // Trigger lazy indexing when user focuses search
    if (index.isLoaded && !hasBuiltIndex.value && !isIndexing.value) {
      buildFileIndexLazy()
    }
  }

  function handleSearchBlur() {
    // Delay to allow click on results
    setTimeout(() => {
      showSearchResults.value = false
    }, 200)
  }

  // Reset selected index when results change
  watch(searchResults, () => {
    selectedResultIndex.value = 0
  })

  // Highlight matching text
  function highlightMatch(text: string, query: string): string {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-primary-500/30 text-primary-300">$1</mark>')
  }

  // Platform detection
  const isMac = typeof window !== 'undefined' && window.navigator.platform.includes('Mac')

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

  function handleRefresh() {
    window.location.reload()
  }
</script>

<template>
  <header
    class="flex h-16 items-center justify-between border-b border-dark-300 bg-dark-100/50 px-6 dark:border-dark-700 dark:bg-dark-800/30"
  >
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm">
        <template v-for="(item, index) in breadcrumb" :key="item">
          <span
            :class="
              index === breadcrumb.length - 1 ? 'text-dark-900 dark:text-dark-100' : 'text-dark-500'
            "
          >
            {{ item }}
          </span>
          <span v-if="index < breadcrumb.length - 1" class="text-dark-400 dark:text-dark-600"
            >/</span
          >
        </template>
      </nav>
    </div>

    <!-- Center - Search -->
    <div class="relative mx-8 max-w-xl flex-1">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="search"
          placeholder="Search files, tables, or data..."
          class="input-search w-full"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @keydown="handleKeyDown"
        />
        <kbd
          v-if="!searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-dark-200 px-1.5 py-0.5 text-xs text-dark-500 dark:bg-dark-700 dark:text-dark-400"
        >
          {{ isMac ? '⌘' : 'Ctrl+' }}K
        </kbd>
        <button
          v-else
          class="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-dark-500 hover:bg-dark-200 hover:text-dark-700 dark:text-dark-400 dark:hover:bg-dark-600 dark:hover:text-dark-200"
          @mousedown.prevent="closeSearch"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Search Results Dropdown -->
      <div
        v-if="
          showSearchResults && (searchResults.length > 0 || searchQuery.length >= 2 || isIndexing)
        "
        class="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-lg border border-dark-300 bg-white shadow-xl dark:border-dark-700 dark:bg-dark-800"
      >
        <!-- Indexing state -->
        <div
          v-if="isIndexing"
          class="flex items-center gap-2 px-4 py-3 text-sm text-dark-500 dark:text-dark-400"
        >
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-dark-300 border-t-primary-500 dark:border-dark-600"
          />
          <span>{{ indexingProgress || 'Building file index...' }}</span>
        </div>

        <!-- No results -->
        <div
          v-else-if="searchQuery.length >= 2 && searchResults.length === 0"
          class="px-4 py-3 text-sm text-dark-500 dark:text-dark-400"
        >
          No results found for "{{ searchQuery }}"
        </div>

        <!-- Results list -->
        <template v-else-if="searchResults.length > 0">
          <div
            class="border-b border-dark-200 px-3 py-2 text-xs font-medium text-dark-500 dark:border-dark-700"
          >
            {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
            <span v-if="allFiles.length > 0" class="text-dark-400 dark:text-dark-600">
              ({{ allFiles.length.toLocaleString() }} files indexed)
            </span>
          </div>
          <button
            v-for="(result, idx) in searchResults"
            :key="`${result.type}-${result.path}-${idx}`"
            class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
            :class="
              idx === selectedResultIndex
                ? 'bg-primary-600/20 text-primary-700 dark:text-primary-300'
                : 'text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700'
            "
            @mousedown.prevent="selectResult(result)"
            @mouseenter="selectedResultIndex = idx"
          >
            <!-- Icon based on type -->
            <File v-if="result.type === 'file'" class="h-4 w-4 shrink-0 text-dark-500" />
            <Folder v-else class="h-4 w-4 shrink-0 text-amber-500" />

            <div class="min-w-0 flex-1">
              <span
                class="truncate font-medium"
                v-html="highlightMatch(result.name, searchQuery)"
              />
              <div
                class="truncate text-xs text-dark-500"
                v-html="highlightMatch(result.path, searchQuery)"
              />
            </div>
          </button>
        </template>

        <!-- Keyboard hints -->
        <div
          class="flex items-center gap-4 border-t border-dark-200 px-3 py-2 text-xs text-dark-500 dark:border-dark-700"
        >
          <span class="flex items-center gap-1">
            <kbd class="rounded bg-dark-200 px-1 dark:bg-dark-700">↑</kbd>
            <kbd class="rounded bg-dark-200 px-1 dark:bg-dark-700">↓</kbd>
            to navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="rounded bg-dark-200 px-1 dark:bg-dark-700">Enter</kbd>
            to select
          </span>
          <span class="flex items-center gap-1">
            <kbd class="rounded bg-dark-200 px-1 dark:bg-dark-700">Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Action buttons -->
      <button class="btn-icon btn-ghost" title="Refresh" @click="handleRefresh">
        <RefreshCw class="h-5 w-5" />
      </button>

      <button class="btn-icon btn-ghost" title="Help">
        <HelpCircle class="h-5 w-5" />
      </button>

      <!-- User avatar / Settings -->
      <router-link
        to="/settings"
        class="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-dark-200 transition-colors hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600"
        title="Settings"
      >
        <Settings class="h-4 w-4 text-dark-500 dark:text-dark-400" />
      </router-link>
    </div>
  </header>
</template>
