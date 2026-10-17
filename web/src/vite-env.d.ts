interface ImportMetaEnv {
  readonly VITE_API_ORIGIN?: string;
  readonly VITE_MAPBOX_PUBLIC_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
