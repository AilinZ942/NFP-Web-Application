<template>
  <main class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-semibold mb-6 text-center">Support Us</h1>
    <p class="text-gray-600 mb-8 text-center">Goals, progress and how to donate.</p>
    <div class="hidden sm:block w-12"></div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
      <div class="w-full max-w-sm text-center">
        <RouterLink
          :to="{ name: 'support.activities' }"
          class="block rounded-2xl hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go to Past Activities">
          <h2 class="text-xl font-medium">Past Activities</h2>
        </RouterLink>
        <p class="text-gray-600 mt-3">Click to check all past activities.</p>
      </div>
      <div class="hidden sm:block w-12"></div>

      
      <div class="w-full max-w-sm text-center">
        <RouterLink
          :to="{ name: 'support.donor' }"
          class="block rounded-2xl hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go to Donors List"
        >
          <h2 class="text-xl font-medium">Donors List</h2>
        </RouterLink>
        <p class="text-gray-600 mt-3">Click to check all donors.</p>
      </div> 
    </div>
  </main>
</template>
