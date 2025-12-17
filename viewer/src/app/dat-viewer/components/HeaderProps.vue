<template>
  <div v-if="isVisible" style="width: 300px" class="relative overflow-hidden">
    <div :style="{ height: HEADERS_HEIGHT + 'px' }" class="bg-dark-100 dark:bg-dark-800" />
    <div
      class="absolute inset-0 m-2 flex flex-col border border-dark-300 bg-white shadow dark:border-dark-600 dark:bg-dark-800"
    >
      <div
        class="flex items-center bg-dark-100 p-2 text-dark-600 shadow dark:bg-dark-700 dark:text-dark-300"
      >
        <span class="px-2">Column properties</span>
        <button
          class="rounded-full border border-dark-400 px-3 hover:bg-dark-200 dark:border-dark-500 dark:hover:bg-dark-600"
          @click="$emit('focus-editing-header')"
        >
          Focus
        </button>
        <button
          class="ml-auto px-2 py-1 hover:text-dark-900 dark:hover:text-dark-100"
          title="Close"
          @click="close"
        >
          <i class="codicon codicon-close"></i>
        </button>
      </div>
      <div v-if="header.name === null" class="p-4 text-dark-700 dark:text-dark-300">
        <div>{{ header.length }} bytes of unidentified data</div>
      </div>
      <div v-else class="overflow-auto p-4 text-dark-700 dark:text-dark-300">
        <div class="mb-4">
          <label for="datv-header-name" class="text-dark-600 dark:text-dark-400">Name</label>
          <input
            id="datv-header-name"
            v-model.trim="header.name"
            placeholder="Unnamed"
            class="mt-1 w-full border border-dark-300 bg-white p-1 text-dark-900 focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            spellcheck="false"
          />
        </div>
        <div class="mb-4 flex items-baseline">
          <div class="mr-2">View mode</div>
          <div class="flex gap-x-px">
            <button
              v-for="opt in viewModeOpts"
              :key="opt.value"
              class="px-2"
              :class="
                byteViewMode === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600'
              "
              :disabled="opt.disabled"
              @click="byteViewMode = opt.value"
              v-text="opt.label"
            />
          </div>
        </div>
        <div class="mb-4">
          <div class="mb-2 flex items-baseline justify-between">
            <span>Data type</span>
            <button
              class="bg-red-100 px-2 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              @click="remove"
            >
              Delete
            </button>
          </div>
          <div>
            <div v-for="opt in dataTypeOpts" :key="opt.value" class="mb-0.5">
              <label class="inline-flex cursor-pointer items-center">
                <input v-model="dataType" type="radio" :value="opt.value" />
                <span class="ml-2">{{ opt.label }}</span>
              </label>
            </div>
            <div v-if="arrayTypeOpts.length" class="mt-3">
              <div class="mb-1 text-dark-500">of ...</div>
              <div v-for="opt in arrayTypeOpts" :key="opt.value" class="mb-0.5">
                <label class="inline-flex cursor-pointer items-center">
                  <input v-model="arrayType" type="radio" :value="opt.value" />
                  <span class="ml-2">{{ opt.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div v-if="header.type.integer" class="mb-4">
          <label class="inline-flex cursor-pointer items-center">
            <input v-model="header.type.integer.unsigned" type="checkbox" />
            <span class="ml-2">Unsigned</span>
          </label>
        </div>
        <div v-if="header.type.key" class="mb-4">
          <label for="datv-header-key-table" class="text-dark-600 dark:text-dark-400">Table</label>
          <select
            id="datv-header-key-table"
            v-model="header.type.key.table"
            class="mt-1 w-full border border-dark-300 bg-white p-1 text-dark-900 focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            :disabled="tablesPreloadNeeded()"
          >
            <option v-for="opt of keyTableOpts" :key="opt.label" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <div v-if="tablesPreloadNeeded()" class="mt-2 italic text-dark-500">
            (pre-load all Data Tables to change)
          </div>
        </div>
        <hr class="my-6 border-dark-200 dark:border-dark-600" />
        <div v-if="keyDisplayColumnOpts.length" class="mb-4">
          <label for="datv-header-key-column" class="text-dark-600 dark:text-dark-400"
            >Display Column</label
          >
          <select
            id="datv-header-key-column"
            v-model="header.type.key!.viewColumn"
            class="mt-1 w-full border border-dark-300 bg-white p-1 text-dark-900 focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
          >
            <option v-for="opt of keyDisplayColumnOpts" :key="opt.label" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div v-if="dataType" class="mb-4">
          <label class="mr-4">Width</label>
          <input
            v-model.number="header.textLength"
            class="w-16 border border-dark-300 bg-white text-center text-dark-900 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
          />
          chars
          <div class="mt-2 italic text-dark-500">
            (move mouse over the column name in Viewer and use `ScrollWheel`, hold `Ctrl` to
            increase resize step)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    inject,
    computed,
    triggerRef,
    reactive,
    watch,
    type WatchStopHandle,
    shallowRef,
  } from 'vue'
  import { type Header, removeHeader } from '../headers.js'
  import { type Viewer, saveHeaders } from '../Viewer.js'
  import { type DatFile, readColumn, type ColumnStats } from 'pathofexile-dat/dat.js'
  import { HEADERS_HEIGHT } from '../rendering.js'
  import type { DatSchemasDatabase, ViewerSerializedHeader } from '@/app/dat-viewer/db.js'
  import { foreignTableSuggestions } from './foreignTableSuggestions.js'

  function dataTypeOpts(header: Header, stats: ColumnStats, datFile: DatFile) {
    const opts = [] as Array<{ label: string; value: string }>

    const { fieldSize } = datFile
    const len = header.length
    if (len === fieldSize.ARRAY && stats.refArray) {
      opts.push({ label: 'Array', value: 'array' })
    }
    if (len === fieldSize.STRING && stats.refString) {
      opts.push({ label: 'String', value: 'string' })
    }
    if (len === fieldSize.KEY && stats.keySelf) {
      opts.push({ label: 'Key (self)', value: 'key_self' })
    }
    if (len === fieldSize.KEY_FOREIGN && stats.keyForeign) {
      opts.push({ label: 'Key (foreign)', value: 'key_foreign' })
    }
    if (/* len === 8 || */ len === 4 || len === 2 /* || len === 1 */) {
      opts.push({ label: 'Integer', value: 'integer' })
    }
    if (/* len === 8 || */ len === 4) {
      opts.push({ label: 'Decimal', value: 'decimal' })
    }
    if (len === 1 && stats.maxValue <= 0x01) {
      opts.push({ label: 'Boolean', value: 'boolean' })
    }

    return opts
  }

  function arrayTypeOpts(header: Header, stats: ColumnStats) {
    const opts = [] as Array<{ label: string; value: string }>

    if (!header.type.array || !stats.refArray) {
      return opts
    }

    const array = stats.refArray
    if (array.string) {
      opts.push({ label: 'String', value: 'string' })
    }
    if (array.keySelf) {
      opts.push({ label: 'Key (self)', value: 'key_self' })
    }
    if (array.keyForeign) {
      opts.push({ label: 'Key (foreign)', value: 'key_foreign' })
    }
    // if (array.numeric64) {
    //   opts.push({ label: 'Integer - 8 bytes', value: 'integer_8' })
    // }
    if (array.numeric32) {
      opts.push({ label: 'Integer - 4 bytes', value: 'integer_4' })
    }
    // if (array.numeric16) {
    //   opts.push({ label: 'Integer - 2 bytes', value: 'integer_2' })
    // }
    // if (array.numeric64) {
    //   opts.push({ label: 'Decimal - 8 bytes', value: 'decimal_8' })
    // }
    if (array.numeric32) {
      opts.push({ label: 'Decimal - 4 bytes', value: 'decimal_4' })
    }
    if (array.boolean) {
      opts.push({ label: 'Boolean', value: 'boolean' })
    }
    // opts.push({ label: 'Integer - byte', value: 'integer_1' })

    return opts
  }

  function useHeadersLoader(tableName: string, db: DatSchemasDatabase) {
    const headers = shallowRef<ViewerSerializedHeader[]>([])

    db.findByName(tableName)
      .then((serialized) => {
        headers.value = serialized
      })
      .catch(() => {})

    return headers
  }

  export default defineComponent({
    setup() {
      const viewer = inject<Viewer>('viewer')!
      const db = inject<DatSchemasDatabase>('dat-schemas')!

      const headerRef = computed(
        () => (viewer.editHeader.value && reactive(viewer.editHeader.value))!
      )
      {
        let watchStop = null as WatchStopHandle | null
        watch(headerRef, (value) => {
          if (watchStop) {
            watchStop()
            watchStop = null
          }
          if (value) {
            watchStop = watch(
              value,
              () => {
                triggerRef(viewer.headers)
                saveHeaders(viewer, db)
              },
              { deep: true }
            )
          }
        })
      }

      const stats = computed(() => viewer.columnStats.value[headerRef.value.offset])

      const dataType = computed({
        get() {
          const type = headerRef.value.type
          if (type.array) {
            return 'array'
          } else if (type.string) {
            return 'string'
          } else if (type.key) {
            return type.key.foreign ? 'key_foreign' : 'key_self'
          } else if (type.integer) {
            return 'integer'
          } else if (type.decimal) {
            return 'decimal'
          } else if (type.boolean) {
            return 'boolean'
          } else {
            return undefined
          }
        },
        set(type) {
          const header = headerRef.value
          header.type = {}
          if (type === 'array') {
            header.type.array = true
            header.type.byteView = { array: true }
          } else if (type === 'string') {
            header.type.string = {}
          } else if (type === 'key_foreign') {
            header.type.key = { foreign: true, table: null, viewColumn: null }
          } else if (type === 'key_self') {
            header.type.key = { foreign: false, table: viewer.name, viewColumn: null }
          } else if (type === 'integer') {
            header.type.integer = { unsigned: false, size: header.length }
          } else if (type === 'decimal') {
            header.type.decimal = { size: header.length }
          } else if (type === 'boolean') {
            header.type.boolean = {}
          }
        },
      })

      const arrayType = computed({
        get() {
          const type = headerRef.value.type
          if (type.string) {
            return 'string'
          } else if (type.key) {
            return type.key.foreign ? 'key_foreign' : 'key_self'
          } else if (type.integer) {
            return `integer_${type.integer.size}`
          } else if (type.decimal) {
            return `decimal_${type.decimal.size}`
          } else if (type.boolean) {
            return 'boolean'
          } else {
            return undefined
          }
        },
        set(type) {
          const header = headerRef.value
          header.type = { array: true }
          if (type === 'string') {
            header.type.string = {}
          } else if (type === 'key_foreign') {
            header.type.key = { foreign: true, table: null, viewColumn: null }
          } else if (type === 'key_self') {
            header.type.key = { foreign: false, table: viewer.name, viewColumn: null }
          } else if (type === 'integer_1') {
            header.type.integer = { unsigned: false, size: 1 }
          } else if (type === 'integer_2') {
            header.type.integer = { unsigned: false, size: 2 }
          } else if (type === 'integer_4') {
            header.type.integer = { unsigned: false, size: 4 }
          } else if (type === 'integer_8') {
            header.type.integer = { unsigned: false, size: 8 }
          } else if (type === 'decimal_4') {
            header.type.decimal = { size: 4 }
          } else if (type === 'decimal_8') {
            header.type.decimal = { size: 8 }
          } else if (type === 'boolean') {
            header.type.boolean = {}
          }
        },
      })

      const viewModeOpts = computed(() => {
        const opts = [] as Array<{ label: string; value: string; disabled?: boolean }>
        const type = headerRef.value.type

        opts.push({ label: 'Bytes', value: 'bytes' })
        if (type.array) {
          opts.push({ label: 'Var. bytes', value: 'array-bytes' })
        }
        opts.push({
          label: 'Data',
          value: 'data',
          disabled: !dataType.value || (dataType.value === 'array' && !arrayType.value),
        })

        return opts
      })

      const byteViewMode = computed<string>({
        get() {
          const type = headerRef.value.type
          if (type.byteView) {
            return type.byteView.array ? 'array-bytes' : 'bytes'
          } else {
            return 'data'
          }
        },
        set(mode) {
          const type = headerRef.value.type
          if (mode === 'data') {
            type.byteView = undefined
          } else {
            type.byteView = {
              array: mode === 'array-bytes',
            }
          }
        },
      })

      const maxKeyRid = computed(() => {
        const values = readColumn(headerRef.value, viewer.datFile)
        // Math.max(null) is 0, this is perfect for us
        return Math.max(
          ...(headerRef.value.type.array ? (values as number[][]).flat() : (values as number[]))
        )
      })

      const keyTableOpts = computed(() => {
        let out: Array<{ value: string | null; label: string }>

        if (!headerRef.value.type.key!.foreign) {
          out = [{ value: viewer.name, label: viewer.name }]
          return out
        }

        out = [{ value: null, label: 'rid (unknown)' }]
        if (db.tableStats.length) {
          const tables = foreignTableSuggestions(viewer.name, maxKeyRid.value, db.tableStats)
          out.push(...tables.map((table) => ({ value: table.name, label: table.name })))
        } else if (headerRef.value.type.key!.table !== null) {
          out.push({
            value: headerRef.value.type.key!.table,
            label: headerRef.value.type.key!.table,
          })
        }
        return out
      })

      const foreignTableColumns = computed(() => {
        if (headerRef.value.type.key?.table) {
          return useHeadersLoader(headerRef.value.type.key.table, db)
        } else {
          return null
        }
      })

      const keyDisplayColumnOpts = computed(() => {
        if (!headerRef.value.type.key) return []

        const out: Array<{ value: string | null; label: string }> = [
          { value: null, label: 'row index' },
        ]
        const headers = !headerRef.value.type.key!.foreign
          ? viewer.headers.value
          : (foreignTableColumns.value?.value ?? [])
        out.push(
          ...headers
            .filter((header) => header.name !== null && header.name.length && !header.type.array)
            .map((header) => ({ label: header.name!, value: header.name! }))
        )
        return out
      })

      function close() {
        viewer.editHeader.value = null
      }

      function remove() {
        removeHeader(headerRef.value, viewer.headers.value)
        viewer.editHeader.value = null
        triggerRef(viewer.headers)
        saveHeaders(viewer, db)
      }

      return {
        isVisible: computed(() => viewer.editHeader.value != null),
        HEADERS_HEIGHT,
        header: headerRef,
        byteViewMode,
        dataType,
        arrayType,
        close,
        remove,
        viewModeOpts,
        keyTableOpts,
        keyDisplayColumnOpts,
        tablesPreloadNeeded: () =>
          headerRef.value.type.key != null
            ? headerRef.value.type.key.foreign && !db.tableStats.length
            : false,
        dataTypeOpts: computed(() => dataTypeOpts(headerRef.value, stats.value, viewer.datFile)),
        arrayTypeOpts: computed(() => arrayTypeOpts(headerRef.value, stats.value)),
      }
    },
  })
</script>
