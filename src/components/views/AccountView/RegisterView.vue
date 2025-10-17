<template>
  <div class="container my-4 py-5">
    <div class="container mt-5">
      <div class="row">
        <div class="col-md-8 offset-md-2">
          <h1 class="text-center">User Register</h1>

          <form @submit.prevent="submitForm">
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="email" class="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  @blur="() => validateEmail(true)"
                  @input="() => validateEmail(false)"
                  v-model="formData.email"
                />
                <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
              </div>

              <div class="col-md-6 col-sm-6">
                <label for="username" class="form-label">Username</label>
                <input
                  id="username"
                  type="text"
                  class="form-control"
                  @blur="() => validateName(true)"
                  @input="() => validateName(false)"
                  v-model="formData.username"
                />

                <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  class="form-control"
                  @blur="() => validatePassword(true)"
                  @input="() => validatePassword(false)"
                  v-model="formData.password"
                />

                <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
              </div>

              <div class="col-md-6 col-sm-6">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control"
                  @blur="() => validateConfirm(true)"
                  v-model="formData.confirmPassword"
                />

                <div v-if="errors.confirmPassword" class="text-danger">
                  {{ errors.confirmPassword }}
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="country" class="form-label">Country</label>
                <input id="country" type="text" class="form-control" v-model="formData.country" />
              </div>
              <div class="col-md-6 col-sm-6 col-xs-6">
                <label for="city" class="form-label">City</label>
                <input id="city" type="text" class="form-control" v-model="formData.city" />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="age" class="form-label">Age</label>
                <select
                  id="age"
                  class="form-select"
                  @blur="() => validateAge(true)"
                  @input="() => validateAge(false)"
                  v-model="formData.age"
                >
                  <option value="16-25">16-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-45">36-45</option>
                  <option value="46-55">46-55</option>
                  <option value="56-65">56-65</option>
                  <option value="65+">65+</option>
                  <option value="notSay">Prefer not to say</option>
                </select>

                <div v-if="errors.age" class="text-danger">{{ errors.age }}</div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="interestTopic" class="form-label">Health Topics of Interest</label>
                <select id="interestTopic" class="form-select" v-model="formData.interestTopic">
                  <option value="Adolescent Health">Adolescent Health</option>
                  <option value="Pregnancy & Postpartum">Pregnancy & Postpartum</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Nutrition & Physical Activity">
                    Nutrition & Physical Activity
                  </option>
                  <option value="Chronic Disease">Chronic Disease</option>
                  <option value="Menopause">Menopause</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <div class="col-md-6 col-sm-6">
                <div class="form-check">
                  <input
                    id="readStatement"
                    type="checkbox"
                    class="form-check-input"
                    @blur="() => validateStatement(true)"
                    @input="() => validateStatement(false)"
                    v-model="formData.readStatement"
                  />
                  <label class="form-check-label" for="readStatement"
                    >I have read and support the Statement of Purpose.</label
                  >
                </div>
                <div v-if="errors.readStatement" class="text-danger">
                  {{ errors.readStatement }}
                </div>
              </div>
            </div>

            <div class="text-center">
              <button type="submit" class="btn btn-primary me-2">Submit</button>
              <button type="button" class="btn btn-outline-secondary" @click="clearForm">
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase/init.js'
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

const router = useRouter()
const CHECK_NAME_URL = 'https://checknameunique-chzb3x46ga-ts.a.run.app'


const formData = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  country: '',
  city: '',
  age: '',
  interestTopic: '',
  readStatement: false,
})

const clearForm = () => {
  formData.value = {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    age: '',
    interestTopic: '',
    readStatement: false,
  }
}

const errors = ref({
  username: null,
  email: null,
  password: null,
  confirmPassword: null,
  age: null,
  readStatement: null,
})

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters'
  } else {
    errors.value.username = null
  }
}

const validateEmail = (blur) => {
  const email = formData.value.email
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)
  if (!validEmail) {
    if (blur) errors.value.email = 'Please enter a valid email.'
  } else {
    errors.value.email = null
  }
}

const validatePassword = (blur) => {
  const password = formData.value.password
  const minLength = 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`
  } else if (!hasUppercase) {
    if (blur) errors.value.password = 'Password must contain at least one uppercase letter.'
  } else if (!hasLowercase) {
    if (blur) errors.value.password = 'Password must contain at least one lowercase letter.'
  } else if (!hasNumber) {
    if (blur) errors.value.password = 'Password must contain at least one number.'
  } else if (!hasSpecialChar) {
    if (blur) errors.value.password = 'Password must contain at least one special character.'
  } else {
    errors.value.password = null
  }
}

const validateConfirm = (blur) => {
  const password = formData.value.password
  const confirmPassword = formData.value.confirmPassword
  if (confirmPassword !== password) {
    if (blur) errors.value.confirmPassword = 'Please enter the same password.'
  } else {
    errors.value.confirmPassword = null
  }
}

const validateAge = (blur) => {
  if (!formData.value.age) {
    if (blur) errors.value.age = 'Please select your age range.'
  } else {
    errors.value.age = null
  }
}

const validateStatement = (blur) => {
  if (!formData.value.readStatement) {
    if (blur) errors.value.readStatement = 'Please read the statement.'
  } else {
    errors.value.readStatement = null
  }
}

async function checkUsernameUnique(usernameRaw) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 6000)
  try {
    const resp = await fetch(CHECK_NAME_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameRaw }),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok || !data?.ok) return { ok: false, unique: false }
    return data 
  } catch {
    return { ok: false, unique: false }
  }
}


const submitForm = async () => {
  validateName(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirm(true)
  validateAge(true)
  validateStatement(true)
  
  const username = formData.value.username.trim()
  const { ok, unique } = await checkUsernameUnique(username)
  if (!ok) {
    errors.value.username = 'Username check failed. Please try again.'
    return
  }
  if (!unique) {
    errors.value.username = 'This username is already taken.'
    return
  }

  if (
    errors.value.username ||
    errors.value.email ||
    errors.value.password ||
    errors.value.confirmPassword ||
    errors.value.age ||
    errors.value.readStatement
  ) return

  const email = formData.value.email.trim()
  const { password, country, city, age, interestTopic } = formData.value
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: username })
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,                   
      username,
      country,
      city,
      age,
      interestTopic,
    }, { merge: true })
    await setDoc(doc(db, 'users', cred.user.uid), {
      email, username, usernameLower: username.toLowerCase(),
      country, city, age, interestTopic,
    }, { merge: true })
    await signOut(auth)
    router.push('/account/login')
    } catch (e) {
      console.error(e)
    }
}
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.card-header {
  background-color: #275fda;
  color: #fff;
  padding: 10px;
  border-radius: 10px 10px 0 0;
}
.list-group-item {
  padding: 10px;
}
</style>
