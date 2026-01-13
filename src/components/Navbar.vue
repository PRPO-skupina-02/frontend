<script setup lang="ts">
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const { user, isLoggedIn, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}

const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return 'U'
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}
</script>

<template>
  <nav class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center space-x-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 3v18" />
            <path d="M3 7.5h4" />
            <path d="M3 12h18" />
            <path d="M3 16.5h4" />
            <path d="M17 3v18" />
            <path d="M17 7.5h4" />
            <path d="M17 16.5h4" />
          </svg>
        </div>
        <span class="text-xl font-bold">CineCore</span>
      </router-link>

      <!-- User Section -->
      <div class="flex items-center space-x-4">
        <template v-if="isLoggedIn">
          <div class="flex items-center space-x-3">
            <span class="text-sm text-muted-foreground">
              {{ user?.first_name || user?.email }}
            </span>
            <Avatar>
              <AvatarFallback class="bg-secondary text-secondary-foreground">
                {{ getInitials(user?.first_name, user?.last_name) }}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" @click="handleLogout">
              Logout
            </Button>
          </div>
        </template>
        <template v-else>
          <Button @click="router.push('/login')">Login</Button>
        </template>
      </div>
    </div>
  </nav>
</template>
