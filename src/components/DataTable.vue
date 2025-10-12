<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },          
  dense: { type: Boolean, default: false },
  globalSearchPlaceholder: { type: String, default: 'Search' },
  exportable: { type: Boolean, default: false },          
  exportFilename: { type: String, default: 'export.csv' },
  exportFilenameBase: { type: String, default: 'export' }
})

const page = ref(1)
const sortKey = ref(props.columns[0]?.key || '')
const sortDir = ref('asc')
const globalQuery = ref('')
const showExport = ref(false)

const colQueries = ref({})
onMounted(() => {
  props.columns.forEach(c => (colQueries.value[c.key] = ''))
})


watch(() => props.rows, () => { page.value = 1 }, { deep: true })

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function compare(a, b, type) {
  const A = a ?? ''
  const B = b ?? ''
  if (type === 'number') return Number(A) - Number(B)
  if (type === 'date')   return new Date(A).getTime() - new Date(B).getTime()
  return String(A).localeCompare(String(B))
}

const filtered = computed(() => {
  const gq = globalQuery.value.trim().toLowerCase()
  return props.rows.filter(r => {
    const hitGlobal = !gq || Object.values(r).some(v => String(v).toLowerCase().includes(gq))
    if (!hitGlobal) return false
    for (const c of props.columns) {
      const cq = (colQueries.value[c.key] || '').trim().toLowerCase()
      if (cq && !String(r[c.key] ?? '').toLowerCase().includes(cq)) return false
    }
    return true
  })
})


const sorted = computed(() => {
  const cdef = props.columns.find(c => c.key === sortKey.value)
  return [...filtered.value].sort((a, b) => {
    const diff = compare(a[sortKey.value], b[sortKey.value], cdef?.type)
    return diff * (sortDir.value === 'asc' ? 1 : -1)
  })
})


const _pageSize = computed(() => Math.min(props.pageSize || 10, 10))
const total = computed(() => sorted.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / _pageSize.value)))
const pageRows = computed(() => sorted.value.slice((page.value - 1) * _pageSize.value, page.value * _pageSize.value))

function go(delta) {
  page.value = Math.min(pageCount.value, Math.max(1, page.value + delta))
}

function displayCell(row, col) {
  const v = row[col.key]
  if (col.format) return String(col.format(v, row) ?? '')
  return Array.isArray(v) ? v.join(', ') : String(v ?? '')
}


function toCSV(rows, cols) {
  const headers = cols.map(c => `"${c.label.replace(/"/g,'""')}"`).join(',')
  const lines = rows.map(r => cols.map(c => {
    let v = r[c.key]
    if (Array.isArray(v)) v = v.join(', ')
    if (v === null || v === undefined) v = ''
    v = String(v)
    return `"${v.replace(/"/g,'""')}"`
  }).join(','))
  return [headers, ...lines].join('\r\n')
}
function downloadCSV() {
  const csv = toCSV(filtered.value, props.columns) 
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = props.exportFilename || 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJSON() {
  const rows = filtered.value.map(r => {
    const o = {}
    for (const c of props.columns) {
      o[c.key] = displayCell(r, c)
    }
    return o
  })
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `${props.exportFilenameBase || 'export'}.json`
  a.click(); URL.revokeObjectURL(url)
  showExport.value = false
}


function downloadPDF() {
  const cols = props.columns
  const rows = filtered.value
  const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  const title = props.exportFilenameBase || 'export'
  doc.setFontSize(14); doc.text(title, 40, 32)
  autoTable(doc, {
    head: [cols.map(c => c.label)],
    body: rows.map(r => cols.map(c => displayCell(r, c))),
    startY: 46,
    styles: { fontSize: 10, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: [245,245,245], textColor: 20 },
    theme: 'grid',
    tableWidth: 'auto',
    margin: { left: 40, right: 40 }
  })
  doc.save(`${title}.pdf`)
  showExport.value = false
}


</script>

<template>
  <div class="space-y-3 ">
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="globalQuery"
        :placeholder="globalSearchPlaceholder"
        class="border px-2 py-1 rounded w-64"
        aria-label="Global search"
      />
    </div>

    <div class="overflow-x-auto ">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              v-for="c in columns"
              :key="c.key"
              @click="toggleSort(c.key)"
              class="border px-3 py-2 text-left select-none cursor-pointer bg-gray-50"
              :aria-sort="sortKey===c.key ? (sortDir==='asc' ? 'ascending' : 'descending') : 'none'"
              scope="col"
            >
              {{ c.label }}
              <span v-if="sortKey===c.key"> {{ sortDir === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
          <tr>
            <th v-for="c in columns" :key="c.key" class="border px-3 py-1 bg-gray-50">
              <input
                v-if="c.searchable !== false"
                v-model="colQueries[c.key]"
                placeholder="Filter"
                class="border px-2 py-1 rounded w-full"
                :aria-label="`Filter by ${c.label}`"
              />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="r in pageRows" :key="r.id ?? JSON.stringify(r)" class="hover:bg-gray-50">
            <td v-for="c in columns" :key="c.key" class="border px-3" :class="dense ? 'py-1' : 'py-2'">
              <template v-if="c.type === 'link'">
                <a :href="r[c.key]" target="_blank" rel="noopener" class="underline break-all">
                  {{ (c.format ? c.format(r[c.key], r) : r[c.key]) || 'Open' }}
                </a>
              </template>
              <template v-else>
                {{ c.format ? c.format(r[c.key], r) : r[c.key] }}
              </template>
            </td>
          </tr>

          <tr v-if="pageRows.length === 0">
            <td :colspan="columns.length" class="border px-3 py-6 text-center text-gray-500">No data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center gap-3 justify-center" data-export-root>
        <div v-if="exportable" class="relative">
            <button @click.stop="showExport = !showExport" class="border px-3 py-1 rounded">
            Export
            </button>
            <div
            v-show="showExport"
            class="absolute left-0 mt-2 w-40 rounded border bg-white shadow-lg z-10"
            role="menu" aria-label="Export format"
            >
            <button @click="downloadCSV"  class="w-full text-left px-3 py-2 hover:bg-gray-50" role="menuitem">CSV</button>
            <button @click="downloadPDF"  class="w-full text-left px-3 py-2 hover:bg-gray-50" role="menuitem">PDF</button>
            <button @click="downloadJSON" class="w-full text-left px-3 py-2 hover:bg-gray-50" role="menuitem">JSON</button>
            </div>
        </div>

        <button @click="go(-1)" :disabled="page<=1" class="border px-3 py-1 rounded disabled:opacity-40">Prev</button>
        <span>{{ page }} / {{ pageCount }}</span>
        <button @click="go(1)" :disabled="page>=pageCount" class="border px-3 py-1 rounded disabled:opacity-40">Next</button>
        <span class="opacity-60">Total {{ total }}</span>
        </div>
  </div>
</template>

<style scoped>
table, th, td { border: 1px solid #e5e7eb; }
</style>
