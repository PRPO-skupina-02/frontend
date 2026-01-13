<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'
import { changePassword, updateCurrentUser } from '@/api/auth/auth/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const router = useRouter()
const { user, setUser } = useAuth()

const loading = ref(false)
const error = ref('')
const success = ref('')

// Profile form
const profileForm = ref({
  first_name: user.value?.first_name || '',
  last_name: user.value?.last_name || '',
})

// Password form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const handleUpdateProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''

    const updatedUser = await updateCurrentUser(profileForm.value)
    setUser(updatedUser)
    success.value = 'Profile updated successfully!'
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

const handleChangePassword = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''

    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
      error.value = 'New passwords do not match'
      return
    }

    if (passwordForm.value.new_password.length < 8) {
      error.value = 'Password must be at least 8 characters long'
      return
    }

    await changePassword({
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
    })

    success.value = 'Password changed successfully!'
    passwordForm.value = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to change password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-4xl p-6">
    <!-- Header -->
    <div class="mb-8">
      <Button variant="ghost" @click="router.back()" class="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2 h-4 w-4"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back
      </Button>
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-muted-foreground">Manage your account settings and preferences</p>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
      {{ error }}
    </div>
    <div v-if="success" class="mb-6 rounded-md bg-green-500/15 p-4 text-sm text-green-600">
      {{ success }}
    </div>

    <!-- Profile Section -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="first_name">First Name</Label>
              <Input
                id="first_name"
                v-model="profileForm.first_name"
                type="text"
                placeholder="John"
              />
            </div>
            <div class="space-y-2">
              <Label for="last_name">Last Name</Label>
              <Input
                id="last_name"
                v-model="profileForm.last_name"
                type="text"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              :value="user?.email"
              type="email"
              disabled
              class="bg-muted"
            />
            <p class="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button type="submit" :disabled="loading" class="w-full sm:w-auto">
            <span v-if="loading">Updating...</span>
            <span v-else>Update Profile</span>
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Password Section -->
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Ensure your account is secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div class="space-y-2">
            <Label for="old_password">Current Password</Label>
            <Input
              id="old_password"
              v-model="passwordForm.old_password"
              type="password"
              placeholder="Enter your current password"
              required
            />
          </div>

          <Separator />

          <div class="space-y-2">
            <Label for="new_password">New Password</Label>
            <Input
              id="new_password"
              v-model="passwordForm.new_password"
              type="password"
              placeholder="Enter new password (min. 8 characters)"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              v-model="passwordForm.confirm_password"
              type="password"
              placeholder="Confirm new password"
              required
            />
          </div>

          <Button type="submit" :disabled="loading" class="w-full sm:w-auto">
            <span v-if="loading">Changing Password...</span>
            <span v-else>Change Password</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
