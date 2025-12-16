import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Tab {
  id: string
  title: string
  icon?: string
  type: string
  args: Record<string, unknown>
  kaScope?: unknown
  kaState?: unknown
}

export const useAppStore = defineStore('app', () => {
  // Sidebar state
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(280)

  // Tab management
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)

  // UI state
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // Computed
  const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value))

  const hasOpenTabs = computed(() => tabs.value.length > 0)

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarWidth(width: number) {
    sidebarWidth.value = Math.max(200, Math.min(500, width))
  }

  function openTab(tab: Omit<Tab, 'id'>) {
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newTab: Tab = { ...tab, id }
    tabs.value.push(newTab)
    activeTabId.value = id
    return id
  }

  function closeTab(tabId: string) {
    const index = tabs.value.findIndex((t) => t.id === tabId)
    if (index !== -1) {
      tabs.value.splice(index, 1)
      if (activeTabId.value === tabId) {
        activeTabId.value = tabs.value[Math.min(index, tabs.value.length - 1)]?.id ?? null
      }
    }
  }

  function setActiveTab(tabId: string) {
    if (tabs.value.some((t) => t.id === tabId)) {
      activeTabId.value = tabId
    }
  }

  function setLoading(loading: boolean, message = '') {
    isLoading.value = loading
    loadingMessage.value = message
  }

  return {
    // State
    sidebarCollapsed,
    sidebarWidth,
    tabs,
    activeTabId,
    isLoading,
    loadingMessage,
    // Computed
    activeTab,
    hasOpenTabs,
    // Actions
    toggleSidebar,
    setSidebarWidth,
    openTab,
    closeTab,
    setActiveTab,
    setLoading,
  }
})
