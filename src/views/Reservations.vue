<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import { timeSlotsShow } from '@/api/spored/timeslots/timeslots'
import { roomsShow } from '@/api/spored/rooms/rooms'
import { theatersShow } from '@/api/spored/theaters/theaters'
import { moviesShow } from '@/api/spored/movies/movies'
import { reservationsList, reservationsCreate } from '@/api/nakup/reservations/reservations'
import type { ApiTimeSlotResponse } from '@/api/spored/model/apiTimeSlotResponse'
import type { ApiRoomResponse } from '@/api/spored/model/apiRoomResponse'
import type { ApiTheaterResponse } from '@/api/spored/model/apiTheaterResponse'
import type { ApiMovieResponse } from '@/api/spored/model/apiMovieResponse'
import type { ApiReservationResponse } from '@/api/nakup/model/apiReservationResponse'

const router = useRouter()
const route = useRoute()
const { isLoggedIn } = useAuth()
const { toast } = useToast()

// State
const timeslot = ref<ApiTimeSlotResponse | null>(null)
const room = ref<ApiRoomResponse | null>(null)
const theater = ref<ApiTheaterResponse | null>(null)
const movie = ref<ApiMovieResponse | null>(null)
const existingReservations = ref<ApiReservationResponse[]>([])
const selectedSeats = ref<Array<{ row: number; col: number }>>([])
const loading = ref(true)
const showConfirmDialog = ref(false)
const isCreatingReservations = ref(false)
const errorMessage = ref<string>('')

// Get params from query
const timeslotId = computed(() => route.query.timeslot as string)
const theaterId = computed(() => route.query.theater as string)
const roomId = computed(() => route.query.room as string)

// Check if timeslot is valid (at least 30 minutes in the future)
const isTimeslotValid = computed(() => {
  if (!timeslot.value?.start_time) return false
  const startTime = new Date(timeslot.value.start_time)
  const now = new Date()
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)
  return startTime > thirtyMinutesFromNow
})

// Check if a seat is reserved
const isSeatReserved = (row: number, col: number): boolean => {
  return existingReservations.value.some((r) => r.row === row && r.col === col)
}

// Check if a seat is selected
const isSeatSelected = (row: number, col: number): boolean => {
  return selectedSeats.value.some((s) => s.row === row && s.col === col)
}

// Toggle seat selection
const toggleSeat = (row: number, col: number): void => {
  if (isSeatReserved(row, col)) return

  const index = selectedSeats.value.findIndex((s) => s.row === row && s.col === col)
  if (index >= 0) {
    selectedSeats.value.splice(index, 1)
  } else {
    selectedSeats.value.push({ row, col })
  }
}

// Format time
const formatTime = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('sl-SI', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Load data
const loadData = async () => {
  if (!timeslotId.value || !theaterId.value || !roomId.value) {
    errorMessage.value = 'Invalid reservation link. Please navigate from the schedule page.'
    loading.value = false
    return
  }

  try {
    // Load timeslot, room, and theater data
    const [timeslotData, roomData, theaterData] = await Promise.all([
      timeSlotsShow(theaterId.value, roomId.value, timeslotId.value),
      roomsShow(theaterId.value, roomId.value),
      theatersShow(theaterId.value),
    ])

    timeslot.value = timeslotData
    room.value = roomData
    theater.value = theaterData

    // Try to load existing reservations (may fail with 403 for regular users)
    try {
      const reservationsData = await reservationsList({ limit: 1000 })
      existingReservations.value = reservationsData.data || []
    } catch (reservationError) {
      // If we can't fetch reservations (403), continue without them
      // Users can still try to reserve seats, the backend will validate
      console.warn('Could not fetch existing reservations:', reservationError)
      existingReservations.value = []
    }

    // Load movie if we have movie_id
    if (timeslotData.movie_id) {
      movie.value = await moviesShow(timeslotData.movie_id)
    }

    loading.value = false
  } catch (error) {
    console.error('Failed to load data:', error)
    errorMessage.value = 'Failed to load reservation data. Please try again.'
    loading.value = false
  }
}

// Open confirmation dialog
const openConfirmDialog = () => {
  showConfirmDialog.value = true
}

// Create reservations
const createReservations = async () => {
  if (!timeslot.value || !theater.value || !room.value || !movie.value) return

  isCreatingReservations.value = true

  // Store metadata for this timeslot in localStorage
  const metadata = {
    theater_id: theater.value.id!,
    room_id: room.value.id!,
    theater_name: theater.value.name,
    room_name: room.value.name,
    movie_name: movie.value.name,
    start_time: timeslot.value.start_time,
  }
  localStorage.setItem(`reservation_${timeslot.value.id}`, JSON.stringify(metadata))

  const results = {
    success: 0,
    failed: 0,
  }

  for (const seat of selectedSeats.value) {
    try {
      await reservationsCreate({
        time_slot_id: timeslot.value.id!,
        theater_id: theater.value.id!,
        room_id: room.value.id!,
        row: seat.row,
        col: seat.col,
        type: 'ONLINE',
      })
      results.success++
    } catch (error) {
      console.error(`Failed to reserve seat ${seat.row}-${seat.col}:`, error)
      results.failed++
      toast({
        title: 'Reservation Failed',
        description: `Failed to reserve seat Row ${seat.row} - Seat ${seat.col}`,
        variant: 'destructive',
      })
    }
  }

  isCreatingReservations.value = false
  showConfirmDialog.value = false

  if (results.success > 0) {
    toast({
      title: 'Reservations Created',
      description: `Successfully reserved ${results.success} seat(s)`,
    })
  }

  // Navigate to My Reservations
  router.push('/my-reservations')
}

// Initialize
onMounted(() => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }

  loadData()
})
</script>

<template>
  <div class="container py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">Reserve Seats</h1>
      <p class="text-muted-foreground">Select your seats for the showing</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-96 w-full" />
    </div>

    <!-- Error State -->
    <Card v-else-if="errorMessage" class="border-destructive">
      <CardHeader>
        <CardTitle class="text-destructive">Error</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">{{ errorMessage }}</p>
        <Button @click="router.push('/schedule')">Go to Schedule</Button>
      </CardContent>
    </Card>

    <!-- Invalid Timeslot -->
    <Card v-else-if="!isTimeslotValid" class="border-destructive">
      <CardHeader>
        <CardTitle class="text-destructive">Reservation Not Available</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          This showing is no longer available for reservations. Reservations close 30 minutes
          before the start time.
        </p>
        <Button @click="router.push('/schedule')">Back to Schedule</Button>
      </CardContent>
    </Card>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Movie Info -->
      <Card>
        <CardHeader>
          <CardTitle>{{ movie?.name }}</CardTitle>
          <CardDescription>
            {{ theater?.name }} - {{ room?.name }} | {{ formatTime(timeslot?.start_time) }}
          </CardDescription>
        </CardHeader>
      </Card>

      <!-- Seat Selection -->
      <Card>
        <CardHeader>
          <CardTitle>Select Seats</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Screen Label -->
          <div class="text-center">
            <Badge variant="secondary" class="px-6 py-2 text-sm">SCREEN</Badge>
          </div>

          <!-- Seat Grid -->
          <div class="flex flex-col gap-2 mx-auto" style="width: fit-content">
            <div
              v-for="row in room?.rows || 0"
              :key="row"
              class="flex items-center gap-2"
            >
              <span class="text-right font-bold text-muted-foreground w-8">{{ row }}</span>
              <button
                v-for="col in room?.columns || 0"
                :key="col"
                type="button"
                :class="[
                  'border-2 rounded text-xs font-medium transition-colors',
                  {
                    'border-gray-300 hover:border-gray-400': !isSeatReserved(row, col) && !isSeatSelected(row, col),
                    'bg-red-500 border-red-500 text-white cursor-not-allowed': isSeatReserved(row, col),
                    'bg-green-500 border-green-500 text-white': isSeatSelected(row, col),
                  },
                ]"
                :disabled="isSeatReserved(row, col)"
                @click="toggleSeat(row, col)"
                style="width: 40px; height: 40px; padding: 0"
              >
                {{ col }}
              </button>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex justify-center gap-6 pt-4">
            <div class="flex items-center gap-2">
              <div class="border-2 border-gray-300 rounded" style="width: 30px; height: 30px"></div>
              <span class="text-sm">Available</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="bg-red-500 border-2 border-red-500 rounded" style="width: 30px; height: 30px"></div>
              <span class="text-sm">Reserved</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="bg-green-500 border-2 border-green-500 rounded" style="width: 30px; height: 30px"></div>
              <span class="text-sm">Selected</span>
            </div>
          </div>

          <!-- Selected Seats -->
          <div v-if="selectedSeats.length > 0" class="pt-4 border-t">
            <p class="text-sm font-semibold mb-2">Selected Seats ({{ selectedSeats.length }}):</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <Badge v-for="seat in selectedSeats" :key="`${seat.row}-${seat.col}`">
                Row {{ seat.row }} - Seat {{ seat.col }}
              </Badge>
            </div>
            <Button class="w-full" @click="openConfirmDialog">
              Reserve {{ selectedSeats.length }} Seat{{ selectedSeats.length > 1 ? 's' : '' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="showConfirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Reservation</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to reserve {{ selectedSeats.length }} seat(s) for:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="py-4 space-y-2">
          <p class="font-semibold">{{ movie?.name }}</p>
          <p class="text-sm text-muted-foreground">
            {{ theater?.name }} - {{ room?.name }}
          </p>
          <p class="text-sm text-muted-foreground">{{ formatTime(timeslot?.start_time) }}</p>
          <div class="pt-2">
            <p class="text-sm font-medium mb-2">Seats:</p>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="seat in selectedSeats" :key="`${seat.row}-${seat.col}`" variant="secondary">
                Row {{ seat.row }} - Seat {{ seat.col }}
              </Badge>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isCreatingReservations">Cancel</AlertDialogCancel>
          <AlertDialogAction :disabled="isCreatingReservations" @click="createReservations">
            {{ isCreatingReservations ? 'Processing...' : 'Confirm Reservation' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
