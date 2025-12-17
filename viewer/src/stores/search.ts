import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Viewer } from '@/app/dat-viewer/Viewer'

export interface OpenedFileInfo {
  id: string
  fullPath: string
  name: string
  viewer: Viewer | null
}

export const useSearchStore = defineStore('search', () => {
  // Track opened files for content search
  const openedFiles = shallowRef<Map<string, OpenedFileInfo>>(new Map())

  // Register a file when it's opened
  function registerFile(id: string, fullPath: string, viewer: Viewer | null) {
    const name = fullPath.substring(fullPath.lastIndexOf('/') + 1)
    const newMap = new Map(openedFiles.value)
    newMap.set(id, { id, fullPath, name, viewer })
    openedFiles.value = newMap
  }

  // Update viewer reference when it becomes available
  function updateViewer(id: string, viewer: Viewer) {
    const file = openedFiles.value.get(id)
    if (file) {
      const newMap = new Map(openedFiles.value)
      newMap.set(id, { ...file, viewer })
      openedFiles.value = newMap
    }
  }

  // Unregister a file when it's closed
  function unregisterFile(id: string) {
    const newMap = new Map(openedFiles.value)
    newMap.delete(id)
    openedFiles.value = newMap
  }

  // Get all opened files
  function getOpenedFiles(): OpenedFileInfo[] {
    return Array.from(openedFiles.value.values())
  }

  return {
    openedFiles,
    registerFile,
    updateViewer,
    unregisterFile,
    getOpenedFiles,
  }
})
