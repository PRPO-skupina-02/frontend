<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import { Toaster } from '@/components/ui/toast'
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar />
    <router-view />
    <Toaster />
  </div>
</template>

<style scoped></style>
