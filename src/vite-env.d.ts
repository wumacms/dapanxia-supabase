/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LANTUZ_MCH_ID: string
  readonly VITE_LANTUZ_API_KEY: string
  readonly VITE_LANTUZ_API_URL: string
  readonly VITE_LANTUZ_NOTIFY_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
