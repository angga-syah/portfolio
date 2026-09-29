import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Angga Rakhmansyah - Portfolio',
    short_name: 'Angga Portfolio',
    description: 'Portfolio website of Angga Rakhmansyah - Computer Science Student & Web Developer',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['portfolio', 'technology', 'developer'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'About Me',
        short_name: 'About',
        description: 'Learn more about Angga Rakhmansyah',
        url: '/#about',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'My Projects',
        short_name: 'Projects',
        description: 'View my portfolio projects',
        url: '/#projects',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Contact',
        short_name: 'Contact',
        description: 'Get in touch with me',
        url: '/#contact',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      }
    ],
    screenshots: [
      {
        src: '/images/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop view of Angga Portfolio'
      },
      {
        src: '/images/screenshot-mobile.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile view of Angga Portfolio'
      }
    ],
    prefer_related_applications: false
  };
}