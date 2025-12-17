<template>
  <div class="datv-header-layer">
    <div :style="headersRowStyle" class="absolute">
      <div
        v-for="col in headers"
        :key="col.offset"
        class="datv-header"
        :class="{ 'datv-col--border': col.border, 'datv-header--active': col.active }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
      >
        <button
          class="datv-header-btn"
          :title="col.name == null ? 'unidentified' : col.name || 'unnamed'"
          @click="editHeader(col.offset)"
          @wheel="handleHeaderWheel(col.offset, $event)"
        >
          <template v-if="col.name === null">&nbsp;</template>
          <span
            v-else-if="col.name === ''"
            class="rounded bg-dark-300 px-1 text-dark-600 dark:bg-dark-600 dark:text-dark-300"
            >?</span
          >
          <template v-else>{{ col.name }}</template>
        </button>
        <!-- Resize handle -->
        <div
          v-if="col.name !== null"
          class="datv-resize-handle"
          @mousedown.prevent.stop="startResize(col.offset, $event)"
        />
      </div>
    </div>
    <div :style="colsRowStyle" class="absolute">
      <button
        v-for="col in columns"
        :key="col.offset"
        class="datv-byte"
        :class="{
          'datv-col--border': col.border,
          'datv-byte--selected': col.selected,
        }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
        :title="String(col.offset)"
        @mousedown="selectStart(col.offset)"
        @mouseenter="selectContinue(col.offset, $event)"
        v-text="col.text"
      />
    </div>
    <div :style="statsRowStyle" class="datv-stats_row absolute">
      <div
        v-for="col in columns"
        :key="col.offset"
        class="datv-stat"
        :class="{
          'datv-col--border': col.border,
          'datv-byte--selected': col.selected,
        }"
        :style="{ width: col.widthPx + 'px', transform: `translate(${col.leftPx}px, 0)` }"
      >
        <template v-if="col.stat">
          <div v-if="col.stat.string" class="datv-stat__line bg-yellow-500" style="top: 0" />
          <div v-if="col.stat.array" class="datv-stat__line bg-green-500" style="top: 7px" />
          <div v-if="col.stat.zero" class="datv-stat__line bg-gray-800" style="top: 14px" />
          <div
            v-else-if="col.stat.nullable"
            class="datv-stat__line bg-pink-400"
            style="top: 14px"
          />
          <div class="datv-stat__max" v-text="col.stat.max" />
        </template>
        <span v-else-if="col.key" class="mx-auto inline-flex h-full items-center"
          ><i class="codicon codicon-key"
        /></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { toggleColsBetween } from '../selection.js'
  import { sortRows } from '../sorting.js'
  import { defineComponent, inject, shallowRef, computed, triggerRef, type PropType } from 'vue'
  import { saveHeaders, type Viewer } from '../Viewer.js'
  import * as rendering from '../rendering.js'
  import { renderHeaderCols } from '../rendering/header-columns.js'
  import type { RenderByte } from '../rendering/byte-columns.js'
  import type { DatSchemasDatabase } from '@/app/dat-viewer/db.js'

  export default defineComponent({
    props: {
      left: {
        type: Number,
        required: true,
      },
      width: {
        type: Number,
        required: true,
      },
      columns: {
        type: Array as PropType<RenderByte[]>,
        required: true,
      },
    },
    setup(props) {
      const sortOrder = shallowRef(0)
      let selectionStart = -1
      let colsBeforeSelection = [] as readonly boolean[]

      const viewer = inject<Viewer>('viewer')!
      const db = inject<DatSchemasDatabase>('dat-schemas')!

      function selectStart(offset: number) {
        selectionStart = offset
        colsBeforeSelection = [...viewer.columnSelection.value]
        toggleColsBetween(
          viewer.columnSelection.value,
          selectionStart,
          selectionStart,
          viewer.headers.value
        )
        triggerRef(viewer.columnSelection)

        document.addEventListener('mouseup', cancelSelection)
        document.addEventListener('mouseleave', cancelSelection)
        function cancelSelection() {
          selectionStart = -1
          document.removeEventListener('mouseup', cancelSelection)
          document.removeEventListener('mouseleave', cancelSelection)
        }
      }

      function selectContinue(offset: number, e: MouseEvent) {
        if (selectionStart === -1 || e.buttons !== 1) return

        const { memsize } = viewer.datFile
        const len = offset - selectionStart
        if (len >= memsize) {
          offset = selectionStart + memsize * 2 - 1
        } else if (len >= 4) {
          offset = selectionStart + 8 - 1
        } else if (len >= 2) {
          offset = selectionStart + 4 - 1
        }
        if (len <= -memsize) {
          offset = selectionStart - memsize * 2 + 1
        } else if (len <= -4) {
          offset = selectionStart - 8 + 1
        } else if (len <= -2) {
          offset = selectionStart - 4 + 1
        }

        viewer.columnSelection.value = [...colsBeforeSelection]
        toggleColsBetween(
          viewer.columnSelection.value,
          selectionStart,
          offset,
          viewer.headers.value
        )
      }

      function editHeader(offset: number) {
        const header = viewer.headers.value.find((h) => h.offset === offset)!
        if (
          viewer.editHeader.value === header &&
          (!header.type.byteView || header.type.byteView.array)
        ) {
          if (sortOrder.value === 0) {
            sortOrder.value = 1
          } else if (sortOrder.value === 1) {
            sortOrder.value = -1
          } else if (sortOrder.value === -1) {
            sortOrder.value = 1
          }
          viewer.rowSorting.value = sortRows(header, sortOrder.value as 1 | -1, viewer.datFile)
        } else {
          viewer.editHeader.value = header
          sortOrder.value = 0
        }
      }

      function handleHeaderWheel(offset: number, e: WheelEvent) {
        e.preventDefault()
        const header = viewer.headers.value.find((h) => h.offset === offset)!
        if (header.textLength != null) {
          header.textLength = Math.max(
            1,
            header.textLength - Math.sign(e.deltaY) * (e.ctrlKey ? 4 * 3 - 2 : 1)
          )
          triggerRef(viewer.headers)
          saveHeaders(viewer, db)
        }
      }

      // Column resize functionality
      let resizeStartX = 0
      let resizeStartWidth = 0
      let resizingHeader: ReturnType<typeof viewer.headers.value.find> | null = null

      function startResize(offset: number, e: MouseEvent) {
        const header = viewer.headers.value.find((h) => h.offset === offset)
        if (!header || header.textLength == null) return

        resizingHeader = header
        resizeStartX = e.clientX
        resizeStartWidth = header.textLength

        document.addEventListener('mousemove', handleResizeMove)
        document.addEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
      }

      function handleResizeMove(e: MouseEvent) {
        if (!resizingHeader) return

        const deltaX = e.clientX - resizeStartX
        const deltaChars = Math.round(deltaX / rendering.CHAR_WIDTH)
        const newTextLength = Math.max(1, resizeStartWidth + deltaChars)

        resizingHeader.textLength = newTextLength
        triggerRef(viewer.headers)
      }

      function handleResizeEnd() {
        if (resizingHeader) {
          saveHeaders(viewer, db)
        }
        resizingHeader = null
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      const headers = computed(() =>
        renderHeaderCols(
          viewer.headers.value,
          viewer.editHeader.value,
          props.left,
          props.left + props.width
        )
      )

      return {
        headers,
        selectStart,
        selectContinue,
        editHeader,
        handleHeaderWheel,
        startResize,
        headersRowStyle: computed(() => ({
          transform: `translate(${-props.left}px, 0)`,
          lineHeight: rendering.COLUMN_BYTE_HEIGHT + 'px',
          fontFamily: rendering.FONT_FAMILY,
          fontSize: rendering.FONT_SIZE + 'px',
        })),
        colsRowStyle: computed(() => ({
          transform: `translate(${-props.left}px, ${rendering.COLUMN_BYTE_HEIGHT}px)`,
          lineHeight: rendering.COLUMN_BYTE_HEIGHT + 'px',
          fontFamily: rendering.FONT_FAMILY,
          fontSize: rendering.FONT_SIZE + 'px',
        })),
        statsRowStyle: computed(() => ({
          transform: `translate(${-props.left}px, ${rendering.COLUMN_BYTE_HEIGHT * 2}px)`,
          fontFamily: rendering.FONT_FAMILY,
          fontSize: rendering.FONT_SIZE + 'px',
        })),
      }
    },
  })
</script>

<style lang="postcss">
  .datv-col--border {
    @apply border-l border-dark-300 dark:border-dark-600;
  }

  .datv-header {
    @apply text-dark-600 dark:text-dark-300;
    position: absolute;
    box-sizing: border-box;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      @apply bg-dark-200 dark:bg-dark-600;
    }

    &.datv-header--active {
      @apply bg-primary-100 dark:bg-primary-600/30;
    }
  }

  .datv-header-btn {
    @apply text-dark-600 dark:text-dark-300;
    width: calc(100% - 8px);
    height: 100%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    @apply px-1.5;

    .datv-header:hover & {
      @apply text-dark-900 dark:text-dark-100;
    }

    .datv-header--active & {
      @apply text-primary-700 dark:text-primary-300;
    }
  }

  .datv-resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: col-resize;
    @apply bg-transparent;

    &:hover {
      @apply bg-primary-500/50;
    }

    &:active {
      @apply bg-primary-500;
    }
  }

  .datv-byte {
    @apply text-dark-500 dark:text-dark-400;
    position: absolute;
    box-sizing: content-box;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      @apply bg-primary-100 text-primary-700 dark:bg-primary-600/40 dark:text-primary-200;
    }

    &.datv-byte--selected {
      @apply bg-primary-200 text-primary-800 dark:bg-primary-600/50 dark:text-primary-100;
    }

    &.datv-byte--selected.datv-col--border,
    &.datv-byte--selected + &.datv-col--border {
      @apply border-primary-500;
    }
  }

  .datv-stat {
    position: absolute;
    box-sizing: content-box;
    text-align: center;
    white-space: nowrap;
    line-height: 21px;
    height: 21px;

    &.datv-byte--selected.datv-col--border,
    &.datv-byte--selected + &.datv-col--border {
      @apply border-dark-400 dark:border-dark-500;
    }

    &.datv-byte--selected {
      @apply bg-dark-200 dark:bg-dark-600;
    }

    .datv-stats_row:hover > & {
      @apply bg-dark-200 dark:bg-dark-600;
    }
  }

  .datv-stat__line {
    position: absolute;
    height: 7px;
    width: 100%;

    .datv-col--border > & {
      width: calc(100% + 1px);
      margin-left: -1px;
    }

    .datv-stats_row:hover & {
      --tw-bg-opacity: 0.5;
    }
  }

  .datv-stat__max {
    visibility: hidden;
    text-align: center;
    cursor: default;
    line-height: 21px;
    width: 100%;
    height: 21px;
    position: absolute;
    top: 0;
    left: 0;
    @apply text-dark-900 dark:text-dark-100;
    text-shadow: 0 0 0.5ch rgb(255 255 255 / 50%);

    .dark & {
      text-shadow: 0 0 0.5ch rgb(0 0 0 / 70%);
    }

    .datv-stats_row:hover & {
      visibility: visible;
    }
  }

  .datv-header-layer {
    position: absolute;
    overflow: hidden;
    transform: translate3d(0, 0, 0);
    contain: strict;
    @apply bg-dark-100 dark:bg-dark-800;
  }
</style>
