/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string
  readonly VITE_SPORED_API_URL: string
  readonly VITE_NAKUP_API_URL: string
  readonly VITE_OBVESTILA_API_URL: string
  readonly VITE_REKLAME_API_URL: string
  readonly VITE_PREDLOGI_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
