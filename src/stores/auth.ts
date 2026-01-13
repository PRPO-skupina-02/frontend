import { ref, computed } from 'vue'
import type { ApiUserResponse, ApiTokenResponse } from '@/api/auth/model'

const user = ref<ApiUserResponse | null>(null)
const accessToken = ref<string | null>(localStorage.getItem('access_token'))

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)

  const setUser = (userData: ApiUserResponse) => {
    user.value = userData
  }

  const setTokens = (tokens: ApiTokenResponse) => {
    accessToken.value = tokens.access_token
    localStorage.setItem('access_token', tokens.access_token)
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

  return {
    user,
    isLoggedIn,
    setUser,
    setTokens,
    logout,
  }
}
