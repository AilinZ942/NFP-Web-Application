<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable.vue'

const route = useRoute()
const rows = ref<any[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    rows.value = await fetch('/Data/Activities.json').then(r => r.json())
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.fullPath, load) 

const columns = [
  { key: 'Title',       label: 'Activity',    type: 'string' },
  { key: 'Date',        label: 'Date',        type: 'date' },
  { key: 'Location',    label: 'Location',    type: 'string' },
  { key: 'Attendees',   label: 'Attendees',   type: 'number' },
  { key: 'Tags',        label: 'Tags',        type: 'string', format: (v:any)=> Array.isArray(v) ? v.join(', ') : String(v||'')},
]
</script>

<template>
  <main class="max-w-6xl mx-auto p-6 text-center">
    <h1 class="text-2xl font-semibold my-4">Past Activities</h1>
    <DataTable
      :rows="rows"
      :columns="columns"
      :pageSize="10"
    />
    <RouterLink :to="{name:'support'}" class="underline">Back</RouterLink>
  </main>
</template>
