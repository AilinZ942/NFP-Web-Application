<template>
  <section class="container my-4 py-5">
    <h2 class="h5 mb-3">Send to All Users</h2>

    <div class="card p-3">
      <div class="mb-3">
        <label class="form-label">Subject</label>
        <input v-model="subject" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Body</label>
        <textarea v-model="body" rows="6" class="form-control"></textarea>
      </div>

      <div class="d-flex align-items-center gap-2 mb-3">
        <button class="btn btn-primary" @click="start" :disabled="running">Start</button>
        <button class="btn btn-outline-secondary" @click="goBack" :disabled="running">Back</button>
        <button v-if="running" class="btn btn-outline-danger" @click="abort = true">Cancel</button>
      </div>

      <div v-if="running || done" class="mt-2">
        <div class="mb-1">Progress: {{ sent }} sent, {{ failed }} failed / {{ total }} total</div>
        <div class="progress" style="height: 10px;">
          <div class="progress-bar" role="progressbar"
               :style="{ width: Math.round((sent+failed)/Math.max(1,total)*100) + '%' }"></div>
        </div>
        <ul v-if="errors.length" class="small text-danger mt-2">
          <li v-for="(e,i) in errors" :key="i">{{ e }}</li>
        </ul>
        <div v-if="done" class="alert alert-info mt-3">
          Finished. Sent {{ sent }}, failed {{ failed }}.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase/init'
import { collection, getDocs } from 'firebase/firestore'


const SEND_URL = 'https://sendmail-chzb3x46ga-ts.a.run.app'

const router = useRouter()
const subject = ref('')                 
const body = ref('')

const running = ref(false)
const done = ref(false)
const abort = ref(false)
const total = ref(0)
const sent = ref(0)
const failed = ref(0)
const errors = ref([])

const today = new Date().toISOString().slice(0,10)

async function start() {
  try {
    running.value = true; done.value = false; abort.value = false
    sent.value = 0; failed.value = 0; errors.value = []

    const snap = await getDocs(collection(db, 'users'))
    const emails = Array.from(
      new Set(
        snap.docs.map(d => (d.data().email || '').toString().trim()).filter(Boolean)
      )
    )
    total.value = emails.length
    if (total.value === 0) { running.value = false; done.value = true; return }

    const idToken = await auth.currentUser.getIdToken()

    const BATCH = 5
    for (let i = 0; i < emails.length; i += BATCH) {
      if (abort.value) break
      const slice = emails.slice(i, i + BATCH)

      const resp = await fetch(SEND_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          to: slice,                  
          subject: subject.value,
          text: body.value,
          fileBase64, 
          fileName, 
          mimeType
        })
      })

      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        failed.value += slice.length
        errors.value.push(data.error || `Batch error at index ${i}`)
      } else {
        sent.value += (data.sent ?? slice.length)
        failed.value += (data.failed ?? 0)
      }
    }
  } catch (e) {
    errors.value.push(e.message || String(e))
  } finally {
    running.value = false
    done.value = true
  }
}

function goBack() { router.push({ name: 'account.profile' }) }

</script>
