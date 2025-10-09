<template>
  <section class="page">
    <h1 class="title">Community</h1>
    <button class="btn" @click="$router.push({ name: 'sendEmail' })">Send Email</button>
  </section>
</template>

<style scoped>
.page {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  padding-top: 2rem;
}
.title {
  min-width: 2.2rem;
}
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #111;
  border-radius: 0.5rem;
  background: #fff;
}
</style>
