import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuth } from './stores/auth'

const app = createApp(App)

// Initialize auth before mounting
const { initializeAuth } = useAuth()
initializeAuth().then(() => {
  app.use(router).mount('#app')
})
