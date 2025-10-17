<template>
  <div class="container my-4 py-5" v-if="loaded">
    <div class="col-md-8 offset-md-2">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h4 mb-0">Edit Profile</h1>
        <div>
          <button class="btn btn-outline-secondary me-2" @click="router.back()" :disabled="saving">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving' : 'Save' }}</button>
        </div>
      </div>

      <div class="card p-4">
        <form @submit.prevent="save">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Username</label>
              <input v-model.trim="form.username" class="form-control" required minlength="3" maxlength="60" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input :value="user.email" class="form-control" disabled />
            </div>

            <div class="col-md-6">
              <label class="form-label">Country</label>
              <input v-model.trim="form.country" class="form-control" maxlength="60" />
            </div>
            <div class="col-md-6">
              <label class="form-label">City</label>
              <input v-model.trim="form.city" class="form-control" maxlength="60" />
            </div>

            <div class="col-md-6">
              <label class="form-label">Age</label>
              <select v-model="form.age" class="form-select" required>
                <option value="16-25">16-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46-55">46-55</option>
                <option value="56-65">56-65</option>
                <option value="65+">65+</option>
                <option value="notSay">Prefer not to say</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Health Topics of Interest</label>
              <select v-model="form.interestTopic" class="form-select" required>
                <option value="Adolescent Health">Adolescent Health</option>
                <option value="Pregnancy & Postpartum">Pregnancy & Postpartum</option>
                <option value="Mental Health">Mental Health</option>
                <option value="Nutrition & Physical Activity">Nutrition & Physical Activity</option>
                <option value="Chronic Disease">Chronic Disease</option>
                <option value="Menopause">Menopause</option>
              </select>
            </div>
          </div>

          <p class="text-success mt-3" v-if="tip.ok">{{ tip.msg }}</p>
          <p class="text-danger mt-3" v-else-if="tip.msg">{{ tip.msg }}</p>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="container my-5 text-center">Loading</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/init.js'
import { doc, getDoc } from 'firebase/firestore'

const router = useRouter()
const user = ref(null)
const form = ref({
  username: '',
  country: '',
  city: '',
  age: 'notSay',
  interestTopic: 'Adolescent Health',
})
const loaded = ref(false)
const saving = ref(false)
const tip = ref({ ok: false, msg: '' })

onMounted(async () => {
  const auth = getAuth()
  const u = auth.currentUser
  if (!u) return router.replace('/account/login')
  user.value = { uid: u.uid, email: u.email }
  const snap = await getDoc(doc(db, 'users', u.uid))
  const d = snap.exists() ? snap.data() : {}
  form.value = {
    username: d.username || u.displayName || '',
    country: d.country || '',
    city: d.city || '',
    age: d.age || 'notSay',
    interestTopic: d.interestTopic || 'Adolescent Health',
  }
  loaded.value = true
})

async function save() {
  if (saving.value) return
  saving.value = true
  tip.value = { ok: false, msg: '' }
  try {
    const FN_URL = 'https://updateuserprofile-chzb3x46ga-ts.a.run.app' 
    const auth = getAuth()
    const idToken = await auth.currentUser.getIdToken()

    const payload = {
      username: form.value.username,
      country: form.value.country,
      city: form.value.city,
      age: form.value.age, 
      interestTopic: form.value.interestTopic,
    }

    const r = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok || !data?.ok) {
      const msg = data?.error || data?.message || 'Save failed'
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }

    tip.value = { ok: true, msg: 'Saved!' }
    router.replace('/account/profile')
  } catch (e) {
    tip.value = { ok: false, msg: e?.message || 'Save failed' }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.card{ border:1px solid #ccc; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,.1); }
</style>
