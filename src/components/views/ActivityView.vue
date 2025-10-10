<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
// import DataTable from '@/components/DataTable.vue'

const route = useRoute()
const rows = ref<any[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    rows.value = await fetch('/data/activities.json').then(r => r.json())
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.fullPath, load) 

const columns = [
  { key: 'title',       label: 'Activity',    type: 'string' },
  { key: 'date',        label: 'Date',        type: 'date' },
  { key: 'location',    label: 'Location',    type: 'string' },
  { key: 'attendees',   label: 'Attendees',   type: 'number' },
  { key: 'fundsRaised', label: 'Raised ($)',  type: 'number' },
  { key: 'tags',        label: 'Tags',        type: 'string', format: (_:any,row:any)=> (row.tags||[]).join(', ') },
]
</script>

<template>
  <main class="max-w-6xl mx-auto p-6">
    <RouterLink :to="{name:'support.hub'}" class="underline">Back</RouterLink>
    <h1 class="text-2xl font-semibold my-4">Past Activities</h1>
  </main>
</template>
