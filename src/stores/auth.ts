import { ref, computed } from 'vue'
import type { ApiUserResponse, ApiTokenResponse } from '@/api/auth/model'
import { getCurrentUser } from '@/api/auth/auth/auth'

const user = ref<ApiUserResponse | null>(null)
const accessToken = ref<string | null>(localStorage.getItem('access_token'))
const isInitialized = ref(false)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)

  const setUser = (userData: ApiUserResponse) => {
    user.value = userData
  }

  const setTokens = (tokens: ApiTokenResponse) => {
    accessToken.value = tokens.access_token ?? null
    localStorage.setItem('access_token', tokens.access_token ?? '')
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token)
    }
  }

  const logout = () => {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  const initializeAuth = async () => {
    if (isInitialized.value) return

    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const userData = await getCurrentUser()
        user.value = userData
      } catch (error) {
        // Token is invalid or expired, clear it
        logout()
      }
    }
    isInitialized.value = true
  }

  return {
    user,
    isLoggedIn,
    setUser,
    setTokens,
    logout,
    initializeAuth,
  }
}
