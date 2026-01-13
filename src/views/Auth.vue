<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { login, register, getCurrentUser } from '@/api/auth/auth/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const router = useRouter()
const { setUser, setTokens } = useAuth()

const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

// Login form
const loginForm = ref({
  email: '',
  password: '',
})

// Register form
const registerForm = ref({
  email: '',
  password: '',
  first_name: '',
  last_name: '',
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const tokens = await login({ email: loginForm.value.email, password: loginForm.value.password })
    setTokens(tokens)
    
    const userData = await getCurrentUser()
    setUser(userData)
    
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  try {
    loading.value = true
    error.value = ''
    
    await register(registerForm.value)
    
    // Auto login after registration
    const tokens = await login({ 
      email: registerForm.value.email, 
      password: registerForm.value.password 
    })
    setTokens(tokens)
    
    const userData = await getCurrentUser()
    setUser(userData)
    
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-8 w-8"
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
        <CardTitle class="text-2xl">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</CardTitle>
        <CardDescription>
          {{ isLogin ? 'Sign in to your CineCore account' : 'Sign up to start booking movies' }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Login Form -->
        <form v-if="isLogin" @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="login-email">Email</Label>
            <Input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="login-password">Password</Label>
            <Input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div v-if="error" class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </Button>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="first-name">First Name</Label>
              <Input
                id="first-name"
                v-model="registerForm.first_name"
                placeholder="John"
              />
            </div>
            <div class="space-y-2">
              <Label for="last-name">Last Name</Label>
              <Input
                id="last-name"
                v-model="registerForm.last_name"
                placeholder="Doe"
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="register-email">Email</Label>
            <Input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              placeholder="your@email.com"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="register-password">Password</Label>
            <Input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div v-if="error" class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </Button>
        </form>

        <Separator class="my-6" />

        <div class="text-center text-sm">
          <button
            type="button"
            @click="toggleMode"
            class="text-primary hover:underline"
          >
            {{ isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in' }}
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
