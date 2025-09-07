<template>
  <div class="container">
    <header class="d-flex justify-content-center py-3">
      <ul class="nav nav-pills">
        <li class="nav-item">
          <router-link to="/healthResource" class="nav-link" active-class="active"
            >Health Resource</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/community" class="nav-link" active-class="active"
            >Community</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/account" class="nav-link" :class="{ active: isAccountRoute }">
            Account
          </router-link>
        </li>
      </ul>
    </header>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAccountRoute = computed(() => route.path.startsWith('/account'))
</script>
