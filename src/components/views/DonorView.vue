<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable.vue'

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
    const data = await fetch('/Data/Donors.json').then(r => r.json())
    rows.value = data.sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => route.fullPath, load)

const columns = [
  { key: 'Donor',  label: 'Donor',   type: 'string' },
  { key: 'Date',   label: 'Date/Time', type: 'date'},
  { key: 'Email',  label: 'Email',   type: 'string' },
  { key: 'Amount', label: 'Amount',  type: 'string' },
  { key: 'Note',   label: 'Note',    type: 'string' }
]
</script>

<template>
  <main class="max-w-6xl mx-auto p-6 text-center">
    <h1 class="text-2xl font-semibold my-4">Donation List</h1>
    <DataTable
      :rows="rows"
      :columns="columns"
      :pageSize="10"
    />
    <RouterLink :to="{name:'support'}" class="underline">Back</RouterLink>
  </main>
</template>
