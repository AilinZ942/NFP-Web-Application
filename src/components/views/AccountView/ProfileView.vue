<template>
  <section class="container my-4 py-5" v-if="user">
    <div v-if="isAdmin" class="mt-4">
      <h2 class="h5 mb-3">All Users</h2>
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Country</th>
              <th>City</th>
              <th>Age</th>
              <th>Topic</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in allUsers" :key="u.uid">
              <td>{{ i + 1 }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.country }}</td>
              <td>{{ u.city }}</td>
              <td>{{ u.age }}</td>
              <td>{{ u.interestTopic }}</td>
            </tr>
          </tbody>
        </table>
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
          <div class="text-center mt-3">
            <button class="btn btn-outline-secondary" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase/init.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

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

const logout = () => {
  signOut(auth).then(() => router.replace('/account/login'))
}
</script>
