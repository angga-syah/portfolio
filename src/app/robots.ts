import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unpam.cloud';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '*.json',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}