/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path for the real SEAPP backend. Defaults to `/seappi`. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
