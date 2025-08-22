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
                <input id="email" type="email" class="form-control" v-model="formData.email" />
              </div>
              <div class="col-md-6 col-sm-6">
                <label for="username" class="form-label">Username</label>
                <input id="username" type="text" class="form-control" v-model="formData.username" />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  class="form-control"
                  v-model="formData.password"
                />
              </div>
              <div class="col-md-6 col-sm-6">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control"
                  v-model="formData.confirmPassword"
                />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="country" class="form-label">Country</label>
                <input id="country" type="text" class="form-control" v-model="formData.country" />
              </div>
              <div class="col-md-6 col-sm-6">
                <label for="city" class="form-label">City</label>
                <input id="city" type="text" class="form-control" v-model="formData.city" />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6 col-sm-6">
                <label for="age" class="form-label">Age</label>
                <select id="age" class="form-select" v-model="formData.age">
                  <option value="16-25">16-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-45">36-45</option>
                  <option value="46-55">46-55</option>
                  <option value="56-65">56-65</option>
                  <option value="65+">65+</option>
                  <option value="notSay">Prefer not to say</option>
                </select>
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
                    v-model="formData.readStatement"
                  />
                  <label class="form-check-label" for="readStatement"
                    >I have read and support the Statement of Purpose.</label
                  >
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

const submittedCards = ref([])

const submitForm = () => {
  console.log('submit!', JSON.parse(JSON.stringify(formData.value)))
  submittedCards.value.push({ ...formData.value })
}

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
