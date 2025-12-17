import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export type Theme = 'dark' | 'light' | 'system'

export interface AppSettings {
  theme: Theme
  fontSize: number
  showLineNumbers: boolean
  wordWrap: boolean
  autoAnalyze: boolean
  cacheEnabled: boolean
  maxRecentFiles: number
  // Viewer specific settings
  highlightSelectedRow: boolean
  copyFormat: 'json' | 'csv' | 'tsv'
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  showLineNumbers: true,
  wordWrap: false,
  autoAnalyze: true,
  cacheEnabled: true,
  maxRecentFiles: 10,
  highlightSelectedRow: true,
  copyFormat: 'json',
}

const STORAGE_KEY = 'poe-dat-studio-settings'

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    console.warn('Failed to load settings from localStorage')
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    console.warn('Failed to save settings to localStorage')
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())

  // Persist settings on change
  watch(settings, (newSettings) => saveSettings(newSettings), { deep: true })

  // Theme management
  function setTheme(theme: Theme) {
    settings.value.theme = theme
    applyTheme(theme)
  }

  function applyTheme(theme: Theme) {
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  // Font size
  function setFontSize(size: number) {
    settings.value.fontSize = Math.max(10, Math.min(20, size))
  }

  // Toggle settings
  function toggleLineNumbers() {
    settings.value.showLineNumbers = !settings.value.showLineNumbers
  }

  function toggleWordWrap() {
    settings.value.wordWrap = !settings.value.wordWrap
  }

  function toggleAutoAnalyze() {
    settings.value.autoAnalyze = !settings.value.autoAnalyze
  }

  function toggleCache() {
    settings.value.cacheEnabled = !settings.value.cacheEnabled
  }

  // Reset to defaults
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  // Viewer settings
  function toggleHighlightSelectedRow() {
    settings.value.highlightSelectedRow = !settings.value.highlightSelectedRow
  }

  function setCopyFormat(format: 'json' | 'csv' | 'tsv') {
    settings.value.copyFormat = format
  }

  // Computed values for CSS variables
  const cssVariables = computed(() => ({
    '--viewer-font-size': `${settings.value.fontSize}px`,
    '--viewer-line-height': `${Math.round(settings.value.fontSize * 1.35)}px`,
  }))

  // Initialize theme on load
  applyTheme(settings.value.theme)

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.value.theme === 'system') {
      applyTheme('system')
    }
  })

  return {
    settings,
    cssVariables,
    setTheme,
    setFontSize,
    toggleLineNumbers,
    toggleWordWrap,
    toggleAutoAnalyze,
    toggleCache,
    toggleHighlightSelectedRow,
    setCopyFormat,
    resetSettings,
  }
})
