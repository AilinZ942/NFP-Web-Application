<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
// import DataTable from '@/components/DataTable.vue'

const route = useRoute()
const rows = ref<any[]>([])
const loading = ref(true)

function fmtCurrency(n: number) {
  const x = Number(n ?? 0)
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(x)
}

async function load() {
  loading.value = true
  try {
    const data = await fetch('/data/donations_list.json').then(r => r.json())
    rows.value = data.sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => route.fullPath, load)

const columns = [
  { key: 'donor',  label: 'Donor',   type: 'string' },
  { key: 'date',   label: 'Date/Time', type: 'date',  format: (v:string)=> new Date(v).toLocaleString() },
  { key: 'amount', label: 'Amount',  type: 'number', format: (v:number)=> fmtCurrency(v) },
  { key: 'method', label: 'Method',  type: 'string' },
  { key: 'note',   label: 'Note',    type: 'string' }
]
</script>

<template>
  <main class="max-w-6xl mx-auto p-6">
    <RouterLink :to="{name:'support.hub'}" class="underline">Back</RouterLink>
    <h1 class="text-2xl font-semibold my-4">Donation List</h1>

    <div class="text-gray-600 mb-4">
      Click headers to sort; use global/column filters to find entries.
    </div>

  </main>
</template>
