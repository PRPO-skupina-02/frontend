<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const router = useRouter()

const features = [
  {
    title: 'Browse Movies',
    description: 'Discover the latest movies playing in theaters',
    icon: '🎬',
  },
  {
    title: 'Book Seats',
    description: 'Reserve your perfect seat with our interactive seat selection',
    icon: '🎟️',
  },
  {
    title: 'Easy Checkout',
    description: 'Quick and secure payment process',
    icon: '✨',
  },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
      <div class="container">
        <div class="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" class="mb-4">
            <span class="text-accent">★</span> Premium Cinema Experience
          </Badge>
          <h1 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Welcome to <span class="text-primary">CineCore</span>
          </h1>
          <p class="mb-8 text-lg text-muted-foreground md:text-xl">
            Your ultimate cinema companion. Book tickets, reserve seats, and enjoy the magic of movies
            like never before.
          </p>
          <div class="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" @click="router.push('/schedule')">
              Browse Movies
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="ml-2 h-5 w-5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
            <Button size="lg" variant="outline" @click="router.push('/reservations')">
              My Reservations
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 md:py-24">
      <div class="container">
        <div class="mb-12 text-center">
          <h2 class="mb-4 text-3xl font-bold">Why Choose CineCore?</h2>
          <p class="text-muted-foreground">Everything you need for the perfect movie experience</p>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <Card v-for="feature in features" :key="feature.title" class="text-center">
            <CardHeader>
              <div class="mb-4 text-5xl">{{ feature.icon }}</div>
              <CardTitle>{{ feature.title }}</CardTitle>
              <CardDescription>{{ feature.description }}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="border-t bg-muted/50 py-16">
      <div class="container">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="mb-4 text-3xl font-bold">Ready to Start?</h2>
          <p class="mb-6 text-muted-foreground">
            Create an account or log in to start booking your favorite movies today
          </p>
          <Button size="lg" @click="router.push('/reservations')">
            Make a Reservation
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
