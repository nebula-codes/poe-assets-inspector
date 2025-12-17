<script setup lang="ts">
  import { computed } from 'vue'
  import {
    Monitor,
    Moon,
    Sun,
    Type,
    Hash,
    WrapText,
    Zap,
    HardDrive,
    RefreshCw,
    Info,
    ExternalLink,
    Github,
    Heart,
  } from 'lucide-vue-next'
  import { useSettingsStore, type Theme } from '@/stores/settings'

  const settingsStore = useSettingsStore()

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 20]

  // Settings sections
  const displaySettings = computed(() => [
    {
      id: 'lineNumbers',
      title: 'Show Line Numbers',
      description: 'Display row numbers in the data viewer',
      icon: Hash,
      enabled: settingsStore.settings.showLineNumbers,
      toggle: settingsStore.toggleLineNumbers,
    },
    {
      id: 'wordWrap',
      title: 'Word Wrap',
      description: 'Wrap long text content in cells',
      icon: WrapText,
      enabled: settingsStore.settings.wordWrap,
      toggle: settingsStore.toggleWordWrap,
    },
  ])

  const performanceSettings = computed(() => [
    {
      id: 'autoAnalyze',
      title: 'Auto-Analyze Files',
      description: 'Automatically analyze column types when opening files',
      icon: Zap,
      enabled: settingsStore.settings.autoAnalyze,
      toggle: settingsStore.toggleAutoAnalyze,
    },
    {
      id: 'cache',
      title: 'Enable Caching',
      description: 'Cache loaded files for faster access',
      icon: HardDrive,
      enabled: settingsStore.settings.cacheEnabled,
      toggle: settingsStore.toggleCache,
    },
  ])

  const copyFormatOptions = [
    { value: 'json' as const, label: 'JSON' },
    { value: 'csv' as const, label: 'CSV' },
    { value: 'tsv' as const, label: 'TSV (Tab-separated)' },
  ]
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-dark-100">Settings</h1>
      <p class="mt-1 text-dark-400">Customize your PoE DAT Studio experience</p>
    </div>

    <!-- Appearance -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">Appearance</h2>
      </div>
      <div class="space-y-6 p-6">
        <!-- Theme -->
        <div>
          <label class="text-sm font-medium text-dark-200">Theme</label>
          <p class="mt-1 text-sm text-dark-500">Choose your preferred color scheme</p>
          <div class="mt-3 flex gap-3">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              :class="[
                'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors',
                settingsStore.settings.theme === option.value
                  ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-600 hover:text-dark-200',
              ]"
              @click="settingsStore.setTheme(option.value)"
            >
              <component :is="option.icon" class="h-5 w-5" />
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div>
          <label class="text-sm font-medium text-dark-200">Font Size</label>
          <p class="mt-1 text-sm text-dark-500">Adjust the text size in the viewer</p>
          <div class="mt-3 flex items-center gap-4">
            <Type class="h-5 w-5 text-dark-500" />
            <select
              :value="settingsStore.settings.fontSize"
              class="input w-32"
              @change="
                settingsStore.setFontSize(Number(($event.target as HTMLSelectElement).value))
              "
            >
              <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}px</option>
            </select>
            <span class="text-sm text-dark-400">
              Preview:
              <span :style="{ fontSize: settingsStore.settings.fontSize + 'px' }">Sample Text</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Display -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">Display</h2>
      </div>
      <div class="divide-y divide-dark-700">
        <div
          v-for="setting in displaySettings"
          :key="setting.id"
          class="flex items-center justify-between p-6"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-dark-700 p-2">
              <component :is="setting.icon" class="h-5 w-5 text-dark-400" />
            </div>
            <div>
              <h3 class="font-medium text-dark-200">{{ setting.title }}</h3>
              <p class="text-sm text-dark-500">{{ setting.description }}</p>
            </div>
          </div>
          <button
            :class="[
              'relative h-6 w-11 rounded-full transition-colors',
              setting.enabled ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="setting.toggle"
          >
            <span
              :class="[
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                setting.enabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Performance -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">Performance</h2>
      </div>
      <div class="divide-y divide-dark-700">
        <div
          v-for="setting in performanceSettings"
          :key="setting.id"
          class="flex items-center justify-between p-6"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-dark-700 p-2">
              <component :is="setting.icon" class="h-5 w-5 text-dark-400" />
            </div>
            <div>
              <h3 class="font-medium text-dark-200">{{ setting.title }}</h3>
              <p class="text-sm text-dark-500">{{ setting.description }}</p>
            </div>
          </div>
          <button
            :class="[
              'relative h-6 w-11 rounded-full transition-colors',
              setting.enabled ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="setting.toggle"
          >
            <span
              :class="[
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                setting.enabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Data Viewer -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">Data Viewer</h2>
      </div>
      <div class="space-y-6 p-6">
        <!-- Copy Format -->
        <div>
          <label class="text-sm font-medium text-dark-200">Copy Format</label>
          <p class="mt-1 text-sm text-dark-500">Format used when copying rows with Ctrl+C</p>
          <div class="mt-3 flex gap-3">
            <button
              v-for="option in copyFormatOptions"
              :key="option.value"
              :class="[
                'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm transition-colors',
                settingsStore.settings.copyFormat === option.value
                  ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-600 hover:text-dark-200',
              ]"
              @click="settingsStore.setCopyFormat(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Highlight Selected Row -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-dark-200">Highlight Selected Row</h3>
            <p class="text-sm text-dark-500">Highlight the currently selected row in the viewer</p>
          </div>
          <button
            :class="[
              'relative h-6 w-11 rounded-full transition-colors',
              settingsStore.settings.highlightSelectedRow ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="settingsStore.toggleHighlightSelectedRow"
          >
            <span
              :class="[
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                settingsStore.settings.highlightSelectedRow ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Reset -->
    <div class="card">
      <div class="flex items-center justify-between p-6">
        <div class="flex items-center gap-4">
          <div class="rounded-lg bg-dark-700 p-2">
            <RefreshCw class="h-5 w-5 text-dark-400" />
          </div>
          <div>
            <h3 class="font-medium text-dark-200">Reset Settings</h3>
            <p class="text-sm text-dark-500">Restore all settings to their default values</p>
          </div>
        </div>
        <button class="btn-secondary" @click="settingsStore.resetSettings">
          Reset to Defaults
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-dark-100">About</h2>
      </div>
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="rounded-xl bg-primary-600/20 p-3">
            <Info class="h-6 w-6 text-primary-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-dark-100">PoE DAT Studio</h3>
            <p class="mt-1 text-sm text-dark-400">
              A modern Path of Exile .dat file viewer and analyzer
            </p>
            <p class="mt-2 text-xs text-dark-500">
              Based on
              <a
                href="https://github.com/SnosMe/poe-dat-viewer"
                target="_blank"
                class="text-primary-400 hover:underline"
                >poe-dat-viewer</a
              >
              by SnosMe
            </p>

            <div class="mt-4 flex gap-4">
              <a
                href="https://github.com/SnosMe/poe-dat-viewer"
                target="_blank"
                class="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200"
              >
                <Github class="h-4 w-4" />
                <span>Source Code</span>
                <ExternalLink class="h-3 w-3" />
              </a>
              <a
                href="https://discord.gg/SJjBdT3"
                target="_blank"
                class="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200"
              >
                <Heart class="h-4 w-4" />
                <span>Discord Community</span>
                <ExternalLink class="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
