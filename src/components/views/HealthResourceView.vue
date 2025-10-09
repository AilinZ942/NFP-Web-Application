<template>
  <div class="container my-4 py-4">
    <h1 class="h4 text-center mb-4">Health Resources</h1>

    <div class="row g-4">
      <div class="col-md-6" v-for="res in resources" :key="res.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-2">{{ res.title }}</h5>

            <div class="d-flex align-items-center flex-wrap gap-2">
              <div class="btn-group" role="group" :aria-label="`Rate ${res.title}`">
                <button
                  v-for="n in 5"
                  :key="n"
                  class="btn btn-sm rate-btn"
                  :class="buttonClass(res, n)"
                  :disabled="!canRate"
                  :aria-pressed="currentUserRating(res) === n"
                  @click="rate(res, n)"
                >
                  {{ n }}
                </button>
              </div>
              <span class="ms-2 small"> {{ displayAvg(res.avgRating) }} / 5.0 </span>
              <span v-if="!canRate" class="text-muted small ms-2">(Login to rate)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { auth, db } from '@/firebase/init.js'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'

const resources = ref([])
let stopRes
onMounted(() => {
  const q = query(collection(db, 'healthy resource'), orderBy('title'))
  stopRes = onSnapshot(q, (snap) => {
    resources.value = snap.docs.map((d) => {
      const data = d.data() || {}
      return {
        id: d.id,
        title: data.title,
        rate: data.rate || {},
        totalRating: Number(data.totalRating || 0),
        ratingsCount: Number(data.ratingsCount || 0),
        avgRating: Number(data.avgRating || 0),
      }
    })
  })
})
onUnmounted(() => stopRes && stopRes())

const uid = ref(null)
let stopAuth
onMounted(() => {
  stopAuth = onAuthStateChanged(auth, (u) => {
    uid.value = u.uid
  })
})
onUnmounted(() => stopAuth && stopAuth())
const canRate = computed(() => !!uid.value)

const currentUserRating = (res) => (uid.value && res.rate ? res.rate[uid.value] || 0 : 0)
const displayAvg = (n) => {
  const num = Number(n || 0)
  return Number.isFinite(num) ? num.toFixed(1) : '0.0'
}
const buttonClass = (res, n) =>
  currentUserRating(res) === n ? 'btn-primary' : 'btn-outline-primary'

const submitRating = async (resId, value) => {
  const userId = uid.value

  const refDoc = doc(db, 'healthy resource', resId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refDoc)

    const data = snap.data() || {}
    const prev = Number((data.rate || {})[userId] || 0)

    let total = Number(data.totalRating || 0)
    let count = Number(data.ratingsCount || 0)

    if (prev > 0) total += value - prev
    else {
      total += value
      count += 1
    }

    const avg = count ? Math.round((total / count) * 10) / 10 : 0

    tx.update(refDoc, {
      totalRating: total,
      ratingsCount: count,
      avgRating: avg,
      ['rate.' + userId]: value,
      updatedAt: serverTimestamp(),
    })
  })
}

const rate = (res, n) => {
  if (!canRate.value) return
  submitRating(res.id, n)
}
</script>

<style scoped>
.rate-btn {
  min-width: 2.2rem;
}
</style>
