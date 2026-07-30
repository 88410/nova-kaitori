/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SITE_MODE?: 'company' | 'product'
  readonly VITE_APP_VERSION_UPDATED_AT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
