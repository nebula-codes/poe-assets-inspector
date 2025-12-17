<template>
  <div :class="$style.bar">
    <div class="flex items-center gap-2">
      <template v-if="selections.length === 0">
        <div class="self-center px-1.5 italic text-dark-500">No bytes selected</div>
      </template>
      <template v-else-if="selections.length === 1">
        <button
          class="flex items-center gap-x-1 rounded px-1.5 hover:bg-dark-600 hover:text-dark-100"
          @click="defineColumn"
        >
          <i class="codicon codicon-add"></i> Define column
        </button>
      </template>
      <template v-else-if="selections.length > 1">
        <div class="mr-1 self-center px-1.5 text-dark-400">Selections</div>
        <!-- eslint-disable-next-line vue/require-v-for-key -->
        <div
          v-for="range in selections"
          class="mr-1 flex items-center rounded bg-dark-700 px-1.5 font-mono text-dark-200"
          v-text="range"
        />
      </template>

      <!-- Selected row info -->
      <template v-if="selectedRow !== null">
        <div class="ml-2 flex items-center gap-2 border-l border-dark-600 pl-2">
          <span class="text-dark-400">Row {{ selectedRow }}</span>
          <button
            class="flex items-center gap-x-1 rounded bg-dark-700 px-2 py-0.5 text-xs hover:bg-dark-600 hover:text-dark-100"
            title="Copy row data (Ctrl+C)"
            @click="copySelectedRow"
          >
            <i class="codicon codicon-copy"></i> Copy Row
          </button>
        </div>
      </template>
    </div>
    <div class="flex gap-x-1">
      <button
        v-if="rowSorting"
        class="rounded border border-dark-500 bg-dark-600 px-1.5 hover:bg-dark-500"
        @click="rowSorting = null"
      >
        Clear sorting
      </button>
      <button
        class="flex items-center gap-x-1 rounded px-1.5 hover:bg-dark-600 hover:text-dark-100"
        @click="restoreSchema"
      >
        <i class="codicon codicon-discard" /> Restore schema
      </button>
      <button
        class="flex items-center gap-x-1 rounded px-1.5 hover:bg-dark-600 hover:text-dark-100"
        @click="showSchema"
      >
        <i class="codicon codicon-json" /> Show schema
      </button>

      <!-- Export dropdown -->
      <div ref="exportDropdownRef" class="relative">
        <button
          class="flex items-center gap-x-1 rounded px-1.5 hover:bg-dark-600 hover:text-dark-100"
          @click="showExportMenu = !showExportMenu"
        >
          <i class="codicon codicon-database" /> Export
          <i class="codicon codicon-chevron-down text-xs"></i>
        </button>
        <div
          v-if="showExportMenu"
          class="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-800 py-1 shadow-lg"
        >
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700"
            @click="exportDataJson"
          >
            <i class="codicon codicon-json"></i>
            Export as JSON
          </button>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700"
            @click="exportDataCsv"
          >
            <i class="codicon codicon-table"></i>
            Export as CSV
          </button>
          <div class="my-1 border-t border-dark-700"></div>
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-dark-200 hover:bg-dark-700"
            @click="copyAllToClipboard"
          >
            <i class="codicon codicon-copy"></i>
            Copy all to clipboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed, inject, triggerRef, ref, onMounted, onUnmounted } from 'vue'
  import { clearColumnSelection, getColumnSelections } from '../selection.js'
  import { createHeaderFromSelected } from '../headers.js'
  import FileSaver from 'file-saver'
  import {
    type Viewer,
    exportAllRows,
    saveHeaders,
    removeHeaders,
    importHeaders,
  } from '../Viewer.js'
  import { openTab } from '../../workbench/workbench-core.js'
  import ShowSchema from './ShowSchema.vue'
  import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'

  export default defineComponent({
    name: 'ViewerActions',
    setup() {
      const viewer = inject<Viewer>('viewer')!
      const db = inject<DatSchemasDatabase>('dat-schemas')!

      const showExportMenu = ref(false)
      const exportDropdownRef = ref<HTMLElement | null>(null)

      const selections = computed(() =>
        getColumnSelections(viewer.columnSelection.value).map((range) =>
          range.map((col) => String(col)).join(' ')
        )
      )

      // Close dropdown when clicking outside
      function handleClickOutside(event: MouseEvent) {
        if (exportDropdownRef.value && !exportDropdownRef.value.contains(event.target as Node)) {
          showExportMenu.value = false
        }
      }

      onMounted(() => {
        document.addEventListener('click', handleClickOutside)
      })

      onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
      })

      function defineColumn() {
        const { editHeader, columnSelection, headers } = viewer
        editHeader.value = createHeaderFromSelected(columnSelection.value, headers.value)
        clearColumnSelection(columnSelection.value)
        triggerRef(headers)
        triggerRef(columnSelection)
        saveHeaders(viewer, db)
      }

      function exportDataJson() {
        const data = exportAllRows(viewer.headers.value, viewer.datFile)
        FileSaver.saveAs(
          new File([JSON.stringify(data, null, 2)], `${viewer.name}.json`, {
            type: 'application/json;charset=utf-8',
          })
        )
        showExportMenu.value = false
      }

      function exportDataCsv() {
        const data = exportAllRows(viewer.headers.value, viewer.datFile)
        if (data.length === 0) return

        const headers = Object.keys(data[0])
        const csvRows = [
          headers.join(','),
          ...data.map((row) =>
            headers
              .map((h) => {
                const val = row[h]
                if (val === null || val === undefined) return ''
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
                if (Array.isArray(val)) return `"${JSON.stringify(val).replace(/"/g, '""')}"`
                return String(val)
              })
              .join(',')
          ),
        ]

        FileSaver.saveAs(
          new File([csvRows.join('\n')], `${viewer.name}.csv`, {
            type: 'text/csv;charset=utf-8',
          })
        )
        showExportMenu.value = false
      }

      async function copyAllToClipboard() {
        const data = exportAllRows(viewer.headers.value, viewer.datFile)
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        showExportMenu.value = false
      }

      function copySelectedRow() {
        if (viewer.selectedRow.value === null) return

        const data = exportAllRows(viewer.headers.value, viewer.datFile)
        const row = data[viewer.selectedRow.value]
        if (row) {
          navigator.clipboard.writeText(JSON.stringify(row, null, 2))
        }
      }

      function showSchema() {
        openTab({
          id: 'poe-dat-viewer@show-schema',
          title: 'Schema',
          type: ShowSchema,
          args: {
            name: viewer.name,
            headers: JSON.parse(JSON.stringify(viewer.headers.value)),
          },
        })
      }

      async function restoreSchema() {
        await removeHeaders(viewer, db)
        await importHeaders(viewer, db)
      }

      return {
        rowSorting: viewer.rowSorting,
        selectedRow: viewer.selectedRow,
        selections,
        showExportMenu,
        exportDropdownRef,
        defineColumn,
        exportDataJson,
        exportDataCsv,
        copyAllToClipboard,
        copySelectedRow,
        showSchema,
        restoreSchema,
      }
    },
  })
</script>

<style lang="postcss" module>
  .bar {
    display: flex;
    justify-content: space-between;
    line-height: 1;
    color: #e2e8f0;
    padding: 0.5rem;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    height: 35px;
  }
</style>
