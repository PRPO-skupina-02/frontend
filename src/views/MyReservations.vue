<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { myReservationsList, reservationsDelete } from '@/api/nakup/reservations/reservations'
import { timeSlotsShow } from '@/api/spored/timeslots/timeslots'
import { roomsShow } from '@/api/spored/rooms/rooms'
import { theatersShow } from '@/api/spored/theaters/theaters'
import { moviesShow } from '@/api/spored/movies/movies'
import type { ApiReservationResponse } from '@/api/nakup/model/apiReservationResponse'
import type { ApiTimeSlotResponse } from '@/api/spored/model/apiTimeSlotResponse'
import type { ApiRoomResponse } from '@/api/spored/model/apiRoomResponse'
import type { ApiTheaterResponse } from '@/api/spored/model/apiTheaterResponse'
import type { ApiMovieResponse } from '@/api/spored/model/apiMovieResponse'

const router = useRouter()
const { isLoggedIn } = useAuth()
const { toast } = useToast()

// Enhanced reservation with related data
interface ReservationMetadata {
  theater_id: string
  room_id: string
  theater_name?: string
  room_name?: string
  movie_name?: string
  start_time?: string
}

interface EnhancedReservation {
  reservation: ApiReservationResponse
  metadata?: ReservationMetadata
}

// State
const reservations = ref<EnhancedReservation[]>([])
const loading = ref(true)
const showCancelDialog = ref(false)
const reservationToCancel = ref<ApiReservationResponse | null>(null)
const isCancelling = ref(false)

// Filter reservations by upcoming/past
const upcomingReservations = computed(() => {
  const now = new Date()
  return reservations.value.filter((r) => {
    if (!r.metadata?.start_time) return true // Show if we don't know the time
    return new Date(r.metadata.start_time) > now
  })
})

const pastReservations = computed(() => {
  const now = new Date()
  return reservations.value.filter((r) => {
    if (!r.metadata?.start_time) return false
    return new Date(r.metadata.start_time) <= now
  })
})

// Load reservation metadata from localStorage
const getReservationMetadata = (timeSlotId: string): ReservationMetadata | undefined => {
  const key = `reservation_${timeSlotId}`
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return undefined
    }
  }
  return undefined
}

// Load reservations
const loadReservations = async () => {
  loading.value = true
  try {
    const response = await myReservationsList({ limit: 1000 })
    const baseReservations = response.data || []

    // Map reservations with metadata
    reservations.value = baseReservations.map((reservation) => ({
      reservation,
      metadata: getReservationMetadata(reservation.time_slot_id!),
    }))
  } catch (error) {
    console.error('Failed to load reservations:', error)
    toast({
      title: 'Error',
      description: 'Failed to load your reservations',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// Format date and time
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'Unknown'
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

// Open cancel dialog
const openCancelDialog = (reservation: ApiReservationResponse) => {
  reservationToCancel.value = reservation
  showCancelDialog.value = true
}

// Cancel reservation
const cancelReservation = async () => {
  if (!reservationToCancel.value?.id) return

  isCancelling.value = true
  try {
    await reservationsDelete(reservationToCancel.value.id)
    toast({
      title: 'Reservation Cancelled',
      description: 'Your reservation has been cancelled successfully',
    })
    await loadReservations()
  } catch (error) {
    console.error('Failed to cancel reservation:', error)
    toast({
      title: 'Error',
      description: 'Failed to cancel reservation',
      variant: 'destructive',
    })
  } finally {
    isCancelling.value = false
    showCancelDialog.value = false
    reservationToCancel.value = null
  }
}

// Initialize
onMounted(() => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }

  loadReservations()
})
</script>

<template>
  <div class="container py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">My Reservations</h1>
      <p class="text-muted-foreground">View and manage your cinema reservations</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>

    <!-- Main Content -->
    <Tabs v-else default-value="upcoming" class="w-full">
      <TabsList class="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="upcoming">
          Upcoming ({{ upcomingReservations.length }})
        </TabsTrigger>
        <TabsTrigger value="past">
          Past ({{ pastReservations.length }})
        </TabsTrigger>
      </TabsList>

      <!-- Upcoming Reservations -->
      <TabsContent value="upcoming" class="mt-6">
        <Card v-if="upcomingReservations.length === 0">
          <CardHeader>
            <CardTitle>No Upcoming Reservations</CardTitle>
            <CardDescription>You don't have any upcoming reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button @click="router.push('/schedule')">Browse Schedule</Button>
          </CardContent>
        </Card>

        <Card v-else>
          <CardHeader>
            <CardTitle>Upcoming Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Theater & Room</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in upcomingReservations" :key="item.reservation.id">
                  <TableCell class="font-medium">
                    {{ item.metadata?.movie_name || 'Unknown Movie' }}
                  </TableCell>
                  <TableCell>
                    <div class="text-sm">
                      <div>{{ item.metadata?.theater_name || 'Unknown Theater' }}</div>
                      <div class="text-muted-foreground">{{ item.metadata?.room_name || 'Unknown Room' }}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>Row {{ item.reservation.row }} - Seat {{ item.reservation.col }}</Badge>
                  </TableCell>
                  <TableCell>
                    {{ formatDateTime(item.metadata?.start_time) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="openCancelDialog(item.reservation)"
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Past Reservations -->
      <TabsContent value="past" class="mt-6">
        <Card v-if="pastReservations.length === 0">
          <CardHeader>
            <CardTitle>No Past Reservations</CardTitle>
            <CardDescription>You don't have any past reservations</CardDescription>
          </CardHeader>
        </Card>

        <Card v-else>
          <CardHeader>
            <CardTitle>Past Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Theater & Room</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in pastReservations"
                  :key="item.reservation.id"
                  class="opacity-60"
                >
                  <TableCell class="font-medium">
                    {{ item.metadata?.movie_name || 'Unknown Movie' }}
                  </TableCell>
                  <TableCell>
                    <div class="text-sm">
                      <div>{{ item.metadata?.theater_name || 'Unknown Theater' }}</div>
                      <div class="text-muted-foreground">{{ item.metadata?.room_name || 'Unknown Room' }}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Row {{ item.reservation.row }} - Seat {{ item.reservation.col }}</Badge>
                  </TableCell>
                  <TableCell>
                    {{ formatDateTime(item.metadata?.start_time) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Cancel Confirmation Dialog -->
    <AlertDialog v-model:open="showCancelDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div v-if="reservationToCancel" class="py-4">
          <p class="text-sm">
            <strong>Seat:</strong> Row {{ reservationToCancel.row }} - Seat {{ reservationToCancel.col }}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isCancelling">Cancel</AlertDialogCancel>
          <AlertDialogAction
            :disabled="isCancelling"
            @click="cancelReservation"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {{ isCancelling ? 'Cancelling...' : 'Confirm Cancellation' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
