/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly glob: (pattern: string, options?: { as?: string; eager?: boolean }) => Record<string, any>
  readonly globEager: (pattern: string, options?: { as?: string }) => Record<string, any>
}