<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase/init.js'
import { signInWithEmailAndPassword } from 'firebase/auth'

const router = useRouter()

const formData = ref({
  email: '',
  password: '',
})

const errors = ref({
  email: null,
  password: null,
  auth: null,
})

const validateEmail = (blur) => {
  if (!formData.value.email) {
    if (blur) errors.value.email = 'Email is required.'
  } else {
    errors.value.email = null
  }
}
const validatePassword = (blur) => {
  if (!formData.value.password) {
    if (blur) errors.value.password = 'Password is required.'
  } else {
    errors.value.password = null
  }
}

const onSubmit = () => {
  validateEmail(true)
  validatePassword(true)
  if (errors.value.email || errors.value.password) return

  errors.value.auth = null
  signInWithEmailAndPassword(auth, formData.value.email, formData.value.password)
    .then(() => {
      router.replace('/account/profile')
    })
    .catch((e) => {
      const code = e?.code || ''
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        errors.value.auth = 'Invalid email or password.'
      }
    })
}
</script>

<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Login</h1>
        <form @submit.prevent="onSubmit">
          <div class="row mb-3">
            <div class="col-md-12">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                v-model.trim="formData.email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
              />
              <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-12">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                class="form-control"
                v-model="formData.password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
              />
              <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
            </div>
          </div>

          <div v-if="errors.auth" class="text-danger mb-3">{{ errors.auth }}</div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Log in</button>
          </div>
          <div class="text-center mt-3">
            <router-link class="link-primary me-4" to="/account/register">Register</router-link>
            <router-link to="/healthResource" class="link-secondary">Continue as Guest</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
