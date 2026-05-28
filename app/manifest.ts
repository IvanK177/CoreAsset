import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CoreAsset — Управление IT-активами',
    short_name: 'CoreAsset',
    description: 'Система учёта компьютеров, лицензий и сотрудников',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#1e3a5f',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
