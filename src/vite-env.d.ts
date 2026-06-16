/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string
  readonly VITE_ALLOW_FUTURE_PUZZLES: string
  readonly VITE_SKIP_START_SCREEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
