<template>
  <section class="container my-4 py-5" v-if="user">
    <div v-if="isAdmin" class="mt-4">
      <div class="text-lg font-medium">Total Users: {{ totalUsers }}</div>
      <div class="text-lg font-medium">User Age Group:</div>
      <ul class="d-flex align-items-center gap-2 flex-wrap mb-0" aria-label="User types by age group">
        <li
          v-for="t in ageList"
          :key="t.age"
          class="badge text-bg-light border"
          :class="selectedAge === t.age ? 'border-primary' : ''"
          role="button"
          tabindex="0"
          @click="selectedAge = (selectedAge === t.age ? null : t.age)"
          @keydown.enter.prevent="selectedAge = (selectedAge === t.age ? null : t.age)"
          @keydown.space.prevent="selectedAge = (selectedAge === t.age ? null : t.age)"
          :aria-pressed="selectedAge === t.age"
        >
          {{ t.age }}: {{ t.count }} ({{ t.pct }}%)
        </li>
      </ul>


      <h2 class="h5 mb-3">All Users</h2>
      <DataTable
        :rows="rowsForTable"
        :columns="userCols"
        :pageSize="10"
        :globalSearchPlaceholder="'Search users'"
      />

      <div v-if="selectedAge" class="my-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          <strong>Selected age:</strong> <span>{{ selectedAge }}</span>
          <button class="btn btn-sm btn-outline-secondary ms-2" @click="selectedAge=null">Clear</button>
        </div>
        <div style="height: 320px;">
          <canvas ref="topicChartEl" aria-label="Interest topics for selected age group (pie chart)" role="img"></canvas>
        </div>
        <p v-if="topicsAgg.length === 0" class="text-muted mt-2">No topics for this age group.</p>
      </div>


      <div class="text-center mt-3">
        <button class="btn btn-outline-secondary" @click="logout">Logout</button>
      </div>
    </div>

    <div v-else class="row justify-content-center mt-4">
      <h1 class="text-center">My Profile</h1>
      <div class="col-md-8">
        <div class="card p-4">
          <div class="row mb-2">
            <div class="col-4 fw-bold">Username</div>
            <div class="col-8">{{ user.username }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">Email</div>
            <div class="col-8">{{ user.email }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">Country</div>
            <div class="col-8">{{ user.country || '-' }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">City</div>
            <div class="col-8">{{ user.city || '-' }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">Age</div>
            <div class="col-8">{{ user.age || '-' }}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">Topic</div>
            <div class="col-8">{{ user.interestTopic || '-' }}</div>
          </div>
          <div class="d-flex justify-content-center gap-2 mt-3">
            <router-link class="btn btn-outline-primary" :to="{ name: 'account.editProfile' }">Edit</router-link>
            <button class="btn btn-outline-secondary" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase/init.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'
import DataTable from '@/components/DataTable.vue'

Chart.register(ArcElement, Tooltip, Legend, PieController)

const router = useRouter()
const user = ref(null)
const allUsers = ref([])
const currentEmail = ref('')
const ADMIN_EMAIL = 'admin1@admin.com'

const loadOwnProfile = (u) => {
  getDoc(doc(db, 'users', u.uid))
    .then((snap) => {
      user.value = snap.exists()
        ? snap.data()
        : { uid: u.uid, email: u.email, username: u.displayName || '' }
    })
    .catch(() => {
      user.value = { uid: u.uid, email: u.email, username: u.displayName || '' }
    })
}

const loadAllUsers = () => {
  getDocs(collection(db, 'users')).then((snap) => {
    allUsers.value = snap.docs.map((d) => ({ ...d.data(), uid: d.id }))
  })
}

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    currentEmail.value = u.email

    if (currentEmail.value === ADMIN_EMAIL) {
      user.value = { email: u.email }
      loadAllUsers()
    } else {
      loadOwnProfile(u)
    }
  })
})

const isAdmin = computed(() => currentEmail.value === ADMIN_EMAIL)
const rowsForTable = computed(() => allUsers.value)
const totalUsers = computed(() => allUsers.value.length)

const userCols = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'age', label: 'Age' },
  { key: 'interestTopic', label: 'Topic' },
]


const AGE_KEY = 'age'
const ageList = computed(() => {
  const total = totalUsers.value
  const counts = {}
  for (const r of allUsers.value) {
    const a = (r?.[AGE_KEY]).toString()
    counts[a] = (counts[a] || 0) + 1
  }
  return Object.entries(counts).map(([age, count]) => ({                                  
    age,                          
    count,
    pct: Math.round((count / total) * 100)   
  }))
  })


function makeColors(n) {
  return Array.from({ length: n }, (_, i) => `hsl(${Math.round((360 * i) / n)} 70% 60%)`)
}

const selectedAge = ref(null)

const usersOfSelectedAge = computed(() => {
  if (!selectedAge.value) return []
  return allUsers.value.filter(u => String(u?.age || 'notSay') === String(selectedAge.value))
})

const TOPIC_KEY = 'interestTopic'
const topicsAgg = computed(() => {
  const counts = {}                                
  for (const u of usersOfSelectedAge.value) {
    const k = (u?.[TOPIC_KEY] ?? 'Unknown').toString().trim()
    counts[k] = (counts[k] || 0) + 1
  }
  return Object.entries(counts).map(([topic, count]) => ({ topic, count }))
})


const topicChartEl = ref(null)
let topicChart = null

function renderTopicPie() {
  if (!selectedAge.value || topicsAgg.value.length === 0) {
    if (topicChart) { topicChart.destroy(); topicChart = null }
    return
  }
  const ctx = topicChartEl.value?.getContext('2d'); if (!ctx) return
  const labels = topicsAgg.value.map(d => d.topic)
  const data = topicsAgg.value.map(d => d.count)
  const colors = makeColors(labels.length)

  if (topicChart) {
    topicChart.data.labels = labels
    topicChart.data.datasets[0].data = data
    topicChart.data.datasets[0].backgroundColor = colors
    topicChart.update()
    return
  }

  topicChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ label: 'Users', 
        data, 
        backgroundColor: colors,    
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
  })
}

watch([selectedAge, topicsAgg], async () => {
   await nextTick()             
   renderTopicPie()
 }, { immediate: true, flush: 'post' })


const logout = () => {
  signOut(auth).then(() => router.replace('/account/login'))
}
</script>
