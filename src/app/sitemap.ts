import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ufetchtube.com';
  
  const routes = [
    '',
    '/youtube-to-mp4',
    '/youtube-to-mp3',
    '/youtube-shorts-downloader',
    '/youtube-transcript-downloader',
    '/how-to-use',
    '/privacy',
    '/terms',
    '/contact',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
