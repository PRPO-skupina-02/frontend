<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { theatersList } from '@/api/spored/theaters/theaters'
import { moviesList } from '@/api/spored/movies/movies'
import { roomsList } from '@/api/spored/rooms/rooms'
import { timeSlotsList } from '@/api/spored/timeslots/timeslots'
import type { ApiTheaterResponse } from '@/api/spored/model/apiTheaterResponse'
import type { ApiMovieResponse } from '@/api/spored/model/apiMovieResponse'
import type { ApiTimeSlotResponse } from '@/api/spored/model/apiTimeSlotResponse'
import type { ApiRoomResponse } from '@/api/spored/model/apiRoomResponse'

const router = useRouter()

// State
const selectedTheaterId = ref<string>('')
const selectedDate = ref<Date>(new Date())
const theaters = ref<ApiTheaterResponse[]>([])
const movies = ref<ApiMovieResponse[]>([])
const rooms = ref<ApiRoomResponse[]>([])
const timeslots = ref<ApiTimeSlotResponse[]>([])
const loadingTheaters = ref(false)
const loadingSchedule = ref(false)

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] as string
}

const formattedDate = computed(() => formatDate(selectedDate.value))
const displayDate = computed(() => {
  return selectedDate.value.toLocaleDateString('sl-SI', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const isToday = computed(() => {
  const today = new Date()
  return formatDate(today) === formatDate(selectedDate.value)
})

// Group timeslots by movie
const moviesWithTimeslots = computed(() => {
  return movies.value.map((movie) => {
    const movieTimeslots = timeslots.value.filter((ts) => ts.movie_id === movie.id)
    return {
      movie,
      timeslots: movieTimeslots,
    }
  }).filter((item) => item.timeslots.length > 0)
})

// Load theaters on mount
const loadTheaters = async () => {
  loadingTheaters.value = true
  try {
    console.log('Fetching theaters from:', import.meta.env.VITE_SPORED_API_URL || 'http://localhost:8083')
    const response = await theatersList({ limit: 100 })
    console.log('Theaters response:', response)
    theaters.value = response.data || []
    console.log('Theaters loaded:', theaters.value.length)
  } catch (error) {
    console.error('Failed to load theaters:', error)
    // Show user-friendly error
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
  } finally {
    loadingTheaters.value = false
  }
}

// Load schedule (movies, rooms, timeslots) for selected theater and date
const loadSchedule = async () => {
  if (!selectedTheaterId.value) return

  loadingSchedule.value = true
  const minLoadingTime = new Promise(resolve => setTimeout(resolve, 700))

  try {
    // Load movies and rooms in parallel
    const [moviesResponse, roomsResponse] = await Promise.all([
      moviesList({ limit: 100 }),
      roomsList(selectedTheaterId.value, { limit: 100 }),
    ])

    movies.value = moviesResponse.data || []
    rooms.value = roomsResponse.data || []

    // Load timeslots for each room
    const timeslotsPromises = rooms.value.map((room) =>
      timeSlotsList(selectedTheaterId.value, room.id!, {
        date: formattedDate.value,
        limit: 100,
      }),
    )

    const timeslotsResponses = await Promise.all(timeslotsPromises)
    timeslots.value = timeslotsResponses.flatMap((response) => response.data || [])

    // Wait for minimum loading time before hiding skeleton
    await minLoadingTime
  } catch (error) {
    console.error('Failed to load schedule:', error)
    await minLoadingTime
  } finally {
    loadingSchedule.value = false
  }
}

// Watch for theater or date changes
watch([selectedTheaterId, formattedDate], () => {
  if (selectedTheaterId.value) {
    loadSchedule()
  }
})

// Navigation
const goToPreviousDay = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() - 1)
  selectedDate.value = newDate
}

const goToNextDay = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + 1)
  selectedDate.value = newDate
}

const goToReservation = (timeslot: ApiTimeSlotResponse) => {
  router.push({
    path: '/reservations',
    query: {
      timeslot: timeslot.id!,
      theater: selectedTheaterId.value,
      room: timeslot.room_id!,
    },
  })
}

const getRoomName = (roomId: string): string => {
  const room = rooms.value.find((r) => r.id === roomId)
  return room?.name || 'Unknown Room'
}

const formatTime = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })
}

// Initialize
loadTheaters()
</script>

<template>
  <div class="container py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">Cinema Schedule</h1>
      <p class="text-muted-foreground">Select a theater and browse movie showtimes</p>
    </div>

    <!-- Theater Selection -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Select Theater</CardTitle>
      </CardHeader>
      <CardContent>
        <Select v-model="selectedTheaterId" :disabled="loadingTheaters">
          <SelectTrigger class="w-full md:w-[300px]">
            <SelectValue placeholder="Select a theater..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="theater in theaters" :key="theater.id" :value="theater.id!">
              {{ theater.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <!-- Date Navigation -->
    <div v-if="selectedTheaterId" class="flex items-center justify-between mb-6">
      <Button variant="outline" :disabled="isToday" @click="goToPreviousDay">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous Day
      </Button>
      <div class="text-center">
        <p class="text-2xl font-semibold">{{ displayDate }}</p>
      </div>
      <Button variant="outline" @click="goToNextDay">
        Next Day
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>

    <!-- No Theater Selected -->
    <Card v-if="!selectedTheaterId && !loadingTheaters" class="text-center py-12">
      <CardContent>
        <p class="text-muted-foreground text-lg">
          Please select a theater to view the schedule
        </p>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loadingSchedule" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i">
        <CardHeader>
          <Skeleton class="h-6 w-3/4 mb-2" />
          <Skeleton class="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton class="h-48 w-full mb-4" />
          <Skeleton class="h-4 w-full mb-2" />
          <Skeleton class="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>

    <!-- Movies with Timeslots -->
    <div
      v-else-if="selectedTheaterId && !loadingSchedule && moviesWithTimeslots.length > 0"
      class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <Card v-for="{ movie, timeslots: movieTimeslots } in moviesWithTimeslots" :key="movie.id">
        <CardHeader>
          <CardTitle>{{ movie.name }}</CardTitle>
          <CardDescription class="flex items-center gap-2">
            <Badge variant="secondary">{{ movie.length_minutes }} min</Badge>
            <Badge v-if="movie.rating" variant="outline">⭐ {{ movie.rating?.toFixed(1) }}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="movie.image_url" class="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              :src="movie.image_url"
              :alt="movie.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-if="movie.description" class="text-sm text-muted-foreground line-clamp-3">
            {{ movie.description }}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-semibold">Showtimes:</p>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="timeslot in movieTimeslots"
                :key="timeslot.id"
                variant="outline"
                size="sm"
                @click="goToReservation(timeslot)"
              >
                {{ formatTime(timeslot.start_time) }}
                <span class="text-xs text-muted-foreground ml-1">
                  ({{ getRoomName(timeslot.room_id!) }})
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- No Movies Found -->
    <Card
      v-else-if="selectedTheaterId && !loadingSchedule && moviesWithTimeslots.length === 0"
      class="text-center py-12"
    >
      <CardContent>
        <p class="text-muted-foreground text-lg">No movies scheduled for this date</p>
        <p class="text-sm text-muted-foreground mt-2">
          Try selecting a different date or check back later
        </p>
      </CardContent>
    </Card>
  </div>
</template>
