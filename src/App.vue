<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar />
    <router-view />
  </div>
</template>

<style scoped></style>
