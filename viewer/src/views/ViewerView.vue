<script setup lang="ts">
  import { ref, computed, inject, watch, onMounted, onUnmounted, effectScope } from 'vue'
  import { useRoute } from 'vue-router'
  import FileSaver from 'file-saver'
  import {
    FileText,
    Upload,
    Download,
    FolderOpen,
    X,
    Maximize2,
    Minimize2,
    Table,
  } from 'lucide-vue-next'
  import DatViewer from '@/app/dat-viewer/components/DatViewer.vue'
  import type { BundleIndex } from '@/app/patchcdn/index-store'
  import { useAppStore, useSearchStore } from '@/stores'
  import type { Viewer } from '@/app/dat-viewer/Viewer'

  interface OpenFile {
    id: string
    title: string
    fullPath: string
    fileContent: Uint8Array
    scope: ReturnType<typeof effectScope>
    state?: unknown
  }

  const route = useRoute()
  const appStore = useAppStore()
  const searchStore = useSearchStore()
  const index = inject<BundleIndex>('bundle-index')!

  // State
  const openFiles = ref<OpenFile[]>([])
  const activeFileId = ref<string | null>(null)
  const isMaximized = ref(false)
  const showDropzone = ref(false)

  // Computed
  const activeFile = computed(() => openFiles.value.find((f) => f.id === activeFileId.value))

  // Load file from route query
  watch(
    () => route.query.file,
    async (filePath) => {
      if (filePath && typeof filePath === 'string') {
        await loadFileFromIndex(filePath)
      }
    },
    { immediate: true }
  )

  // Load file from bundle index
  async function loadFileFromIndex(fullPath: string) {
    // Check if already open
    const existing = openFiles.value.find((f) => f.fullPath === fullPath)
    if (existing) {
      activeFileId.value = existing.id
      return
    }

    try {
      appStore.setLoading(true, `Loading ${fullPath}...`)
      const fileContent = await index.loadFileContent(fullPath)
      const fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1)

      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      openFiles.value.push({
        id,
        title: fileName,
        fullPath,
        fileContent,
        scope: effectScope(),
      })
      activeFileId.value = id
      searchStore.registerFile(id, fullPath, null)
    } catch (error) {
      console.error('Failed to load file:', error)
    } finally {
      appStore.setLoading(false)
    }
  }

  // Handle local file upload
  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const fileContent = new Uint8Array(buffer)
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const fullPath = `local/${file.name}`
    openFiles.value.push({
      id,
      title: file.name,
      fullPath,
      fileContent,
      scope: effectScope(),
    })
    activeFileId.value = id
    searchStore.registerFile(id, fullPath, null)
    input.value = ''
  }

  // Close file
  function closeFile(fileId: string) {
    const idx = openFiles.value.findIndex((f) => f.id === fileId)
    if (idx !== -1) {
      openFiles.value[idx].scope.stop()
      openFiles.value.splice(idx, 1)
      searchStore.unregisterFile(fileId)
      if (activeFileId.value === fileId) {
        activeFileId.value = openFiles.value[Math.min(idx, openFiles.value.length - 1)]?.id ?? null
      }
    }
  }

  // Update search store when viewer state is created
  function handleViewerStateUpdate(fileId: string, state: unknown) {
    if (state) {
      searchStore.updateViewer(fileId, state as Viewer)
    }
  }

  // Export active file
  function exportActiveFile() {
    if (!activeFile.value) return
    const blob = new Blob([activeFile.value.fileContent.buffer as ArrayBuffer], {
      type: 'application/octet-stream',
    })
    FileSaver.saveAs(blob, activeFile.value.title)
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    showDropzone.value = true
  }

  function handleDragLeave() {
    showDropzone.value = false
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    showDropzone.value = false

    const file = event.dataTransfer?.files[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const fileContent = new Uint8Array(buffer)
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullPath = `local/${file.name}`

    openFiles.value.push({
      id,
      title: file.name,
      fullPath,
      fileContent,
      scope: effectScope(),
    })
    activeFileId.value = id
    searchStore.registerFile(id, fullPath, null)
  }

  // Listen for open file events
  function handleOpenLocalFile() {
    document.getElementById('file-upload')?.click()
  }

  // Handle files passed from dashboard
  async function handleOpenLocalFiles(event: CustomEvent<FileList>) {
    const files = event.detail
    if (!files?.length) return

    for (const file of Array.from(files)) {
      const buffer = await file.arrayBuffer()
      const fileContent = new Uint8Array(buffer)
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const fullPath = `local/${file.name}`

      openFiles.value.push({
        id,
        title: file.name,
        fullPath,
        fileContent,
        scope: effectScope(),
      })
      activeFileId.value = id
      searchStore.registerFile(id, fullPath, null)
    }
  }

  onMounted(() => {
    window.addEventListener('open-local-file', handleOpenLocalFile)
    window.addEventListener('open-local-files', handleOpenLocalFiles as unknown as EventListener)
  })

  onUnmounted(() => {
    window.removeEventListener('open-local-file', handleOpenLocalFile)
    window.removeEventListener('open-local-files', handleOpenLocalFiles as unknown as EventListener)
    // Clean up scopes
    openFiles.value.forEach((f) => f.scope.stop())
  })
</script>

<template>
  <div
    class="flex h-full flex-col"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Hidden file input -->
    <input
      id="file-upload"
      type="file"
      accept=".datc64,.dat"
      class="hidden"
      @change="handleFileUpload"
    />

    <!-- Tab bar -->
    <div v-if="openFiles.length" class="flex items-center border-b border-dark-700 bg-dark-800/50">
      <!-- Tabs -->
      <div class="flex flex-1 items-center gap-1 overflow-x-auto px-2 py-1">
        <button
          v-for="file in openFiles"
          :key="file.id"
          :class="[
            'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
            activeFileId === file.id
              ? 'bg-dark-700 text-dark-100'
              : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-200',
          ]"
          @click="activeFileId = file.id"
        >
          <FileText class="h-4 w-4 shrink-0" />
          <span class="max-w-32 truncate">{{ file.title }}</span>
          <button
            class="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-dark-600 group-hover:opacity-100"
            @click.stop="closeFile(file.id)"
          >
            <X class="h-3 w-3" />
          </button>
        </button>
      </div>

      <!-- Tab actions -->
      <div class="flex items-center gap-1 border-l border-dark-700 px-2">
        <button class="btn-icon btn-ghost p-1.5" title="Export" @click="exportActiveFile">
          <Download class="h-4 w-4" />
        </button>
        <button
          class="btn-icon btn-ghost p-1.5"
          :title="isMaximized ? 'Restore' : 'Maximize'"
          @click="isMaximized = !isMaximized"
        >
          <Minimize2 v-if="isMaximized" class="h-4 w-4" />
          <Maximize2 v-else class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="relative flex-1 overflow-hidden">
      <!-- Empty state -->
      <div v-if="!openFiles.length" class="flex h-full flex-col items-center justify-center p-8">
        <div class="mb-6 rounded-2xl bg-dark-800 p-6">
          <Table class="h-16 w-16 text-dark-600" />
        </div>
        <h2 class="text-xl font-semibold text-dark-200">No files open</h2>
        <p class="mt-2 text-dark-500">Open a .datc64 file to start exploring</p>

        <div class="mt-8 flex gap-4">
          <label class="btn-primary cursor-pointer">
            <Upload class="h-4 w-4" />
            <span>Open File</span>
            <input type="file" accept=".datc64,.dat" class="hidden" @change="handleFileUpload" />
          </label>
          <button class="btn-secondary">
            <FolderOpen class="h-4 w-4" />
            <span>Browse Index</span>
          </button>
        </div>

        <p class="mt-6 text-sm text-dark-500">or drag and drop a file here</p>
      </div>

      <!-- Viewer -->
      <template v-else>
        <div
          v-for="file in openFiles"
          v-show="activeFileId === file.id"
          :key="file.id"
          class="absolute inset-0 flex flex-col bg-dark-900"
        >
          <DatViewer
            v-model:ka-state="file.state as any"
            :args="{ fileContent: file.fileContent, fullPath: file.fullPath }"
            :ka-scope="file.scope as any"
            @update:ka-state="handleViewerStateUpdate(file.id, $event)"
          />
        </div>
      </template>

      <!-- Drop zone overlay -->
      <div
        v-if="showDropzone"
        class="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/90 backdrop-blur-sm"
      >
        <div
          class="rounded-xl border-2 border-dashed border-primary-500 bg-primary-600/10 p-12 text-center"
        >
          <Upload class="mx-auto h-12 w-12 text-primary-400" />
          <p class="mt-4 text-lg font-medium text-dark-100">Drop file to open</p>
          <p class="mt-1 text-sm text-dark-400">Supports .datc64 and .dat files</p>
        </div>
      </div>
    </div>
  </div>
</template>
