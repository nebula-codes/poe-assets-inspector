<template>
  <div :class="$style.bar">
    <div class="flex">
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
      <button
        class="flex items-center gap-x-1 rounded px-1.5 hover:bg-dark-600 hover:text-dark-100"
        @click="exportDataJson"
      >
        <i class="codicon codicon-database" /> Export data
      </button>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed, inject, triggerRef } from 'vue'
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

      const selections = computed(() =>
        getColumnSelections(viewer.columnSelection.value).map((range) =>
          range.map((col) => String(col)).join(' ')
        )
      )

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
        selections,
        defineColumn,
        exportDataJson,
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
