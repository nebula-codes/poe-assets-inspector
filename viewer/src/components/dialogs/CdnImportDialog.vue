<script setup lang="ts">
  import { ref, computed, inject, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { Globe, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-vue-next'
  import type { BundleIndex } from '@/app/patchcdn/index-store'
  import type { DatSchemasDatabase } from '@/app/dat-viewer/db'

  const emit = defineEmits<{
    close: []
  }>()

  const router = useRouter()
  const index = inject<BundleIndex>('bundle-index')!
  const db = inject<DatSchemasDatabase>('dat-schemas')!

  const patchVersion = ref(localStorage.getItem('POE_PATCH_VER') || '')
  const latestPatch = ref<{ poe: string; poe2: string } | null>(null)
  const isImporting = ref(false)
  const error = ref('')

  const isLoading = computed(() => index.loader.progress.value != null)
  const progress = computed(() => index.loader.progress.value)

  onMounted(async () => {
    // Fetch latest patch versions
    try {
      const res = await fetch('https://poe-versions.obsoleet.org')
      latestPatch.value = await res.json()
    } catch {
      console.warn('Could not fetch latest patch versions')
    }

    // Load schema if not loaded
    if (!db.isLoaded) {
      db.fetchSchema()
    }
  })

  async function handleImport() {
    if (!patchVersion.value.trim()) {
      error.value = 'Please enter a patch version'
      return
    }

    error.value = ''
    isImporting.value = true

    try {
      await index.loader.setPatch(patchVersion.value)
      await index.loadIndex()
      localStorage.setItem('POE_PATCH_VER', patchVersion.value)
      emit('close')
      router.push('/viewer')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isImporting.value = false
    }
  }

  function usePatch(version: string) {
    patchVersion.value = version
  }
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-green-600/20 p-2">
          <Globe class="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-dark-100">Import from Patch CDN</h2>
          <p class="text-sm text-dark-400">Download files directly from PoE patch servers</p>
        </div>
      </div>
    </div>

    <!-- Latest versions -->
    <div v-if="latestPatch" class="mb-6 rounded-lg bg-dark-700/50 p-4">
      <p class="text-sm text-dark-300">
        <span class="text-dark-400">Latest versions:</span>
      </p>
      <div class="mt-2 flex gap-3">
        <button
          class="rounded-lg bg-dark-600 px-3 py-1.5 text-sm text-dark-200 hover:bg-dark-500"
          @click="usePatch(latestPatch.poe)"
        >
          PoE 1: <code class="font-mono text-primary-400">{{ latestPatch.poe }}</code>
        </button>
        <button
          class="rounded-lg bg-dark-600 px-3 py-1.5 text-sm text-dark-200 hover:bg-dark-500"
          @click="usePatch(latestPatch.poe2)"
        >
          PoE 2: <code class="font-mono text-primary-400">{{ latestPatch.poe2 }}</code>
        </button>
      </div>
    </div>

    <!-- Input form -->
    <div class="space-y-4">
      <div>
        <label class="mb-2 block text-sm font-medium text-dark-200">Patch Version</label>
        <div class="flex gap-3">
          <input
            v-model="patchVersion"
            type="text"
            placeholder="e.g., 3.25.0.0.0"
            class="input flex-1 font-mono"
            :disabled="isImporting"
            @keyup.enter="handleImport"
          />
          <button
            class="btn-primary whitespace-nowrap"
            :disabled="isImporting || !patchVersion.trim()"
            @click="handleImport"
          >
            <Loader2 v-if="isImporting" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            <span>{{ isImporting ? 'Importing...' : 'Import' }}</span>
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div v-if="progress" class="rounded-lg bg-dark-700/50 p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-dark-300">{{ progress.bundleName }}</span>
          <span class="text-dark-400">
            {{ Math.round((progress.received / progress.totalSize) * 100) }}%
          </span>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-dark-600">
          <div
            class="h-full bg-primary-500 transition-all"
            :style="{ width: `${(progress.received / progress.totalSize) * 100}%` }"
          />
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-start gap-2 rounded-lg bg-red-900/20 p-3 text-red-400">
        <AlertCircle class="h-5 w-5 shrink-0" />
        <span class="text-sm">{{ error }}</span>
      </div>

      <!-- Schema status -->
      <div class="flex items-center gap-2 text-sm text-dark-400">
        <Loader2 v-if="db.isLoading" class="h-4 w-4 animate-spin" />
        <CheckCircle v-else class="h-4 w-4 text-green-400" />
        <span>
          {{ db.isLoading ? 'Downloading schema...' : 'Schema loaded from' }}
          <a
            href="https://github.com/poe-tool-dev/dat-schema"
            target="_blank"
            class="text-primary-400 hover:underline"
          >
            poe-tool-dev/dat-schema
          </a>
        </span>
      </div>
    </div>

    <!-- Help text -->
    <div class="mt-6 rounded-lg border border-dark-700 bg-dark-800/50 p-4">
      <p class="text-sm text-dark-400">
        This is useful when a new league is released. While the update is still downloading, you can
        review files and fix schema directly from the update servers.
      </p>
    </div>
  </div>
</template>
