<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
const router = useRouter()
const FN_URL = 'https://australia-southeast1-fit5032-assignment-23fa4.cloudfunctions.net/sendMail'

const to = ref('')
const subject = ref('')
const body = ref('')
const fileInput = ref(null)
const sending = ref(false)
const tip = ref('')

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result || '')
      resolve({
        base64: s.includes(',') ? s.split(',')[1] : s,
        mime: file.type,
        name: file.name,
      })
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

async function send() {
  sending.value = true
  tip.value = ''
  try {
    const payload = {
      to: to.value.trim(),
      subject: subject.value.trim(),
      text: body.value,
    }

    const f = fileInput.value?.files?.[0]
    if (f) {
      const { base64, mime, name } = await toBase64(f)
      Object.assign(payload, { fileBase64: base64, mimeType: mime, fileName: name })
    }

    const { data } = await axios.post(FN_URL, payload)
    if (data?.ok) {
      tip.value = 'Sent successfully'
      setTimeout(() => router.back(), 800)
    } else {
      tip.value = data?.error || 'Failed to send'
    }
  } catch (e) {
    tip.value = e?.message || 'Unexpected error'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="container py-4">
    <h1 class="text-center mb-4">Send Email</h1>

    <form class="row g-3" @submit.prevent="send">
      <div class="col-12">
        <label class="form-label">Receivers</label>
        <input v-model="to" class="form-control" placeholder="a@b.com, c@d.com" required />
      </div>
      <div class="col-12">
        <label class="form-label">Subject</label>
        <input v-model="subject" class="form-control" placeholder="Subject" required />
      </div>

      <div class="col-12">
        <label class="form-label">Message</label>
        <textarea
          v-model="body"
          class="form-control"
          rows="8"
          placeholder="Your message"
        ></textarea>
        <div class="col-12 col-md-4">
          <label class="form-label">Attachment</label>
          <input
            ref="fileInput"
            type="file"
            class="form-control"
            accept="image/*,application/pdf,text/plain,text/markdown,application/json,text/x-log"
          />
        </div>
      </div>

      <div class="col-12 d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-outline-dark" @click="$router.back()">Cancel</button>
        <button class="btn btn-dark" :disabled="sending">Send</button>
      </div>

      <div class="col-12 text-muted">{{ tip }}</div>
    </form>
  </section>
</template>
