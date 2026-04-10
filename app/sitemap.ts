import { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.findmeakitchen.com'

  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/match`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/find-events`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/markets`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/festivals`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/blog`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/resources`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/browse/dark-kitchens`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/browse/shared-kitchens`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/browse/mobile-units`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/browse/marketplaces`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/faq`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.5, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/list-kitchen`, priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  const blogSlugs = getAllSlugs()
  const blogPages = blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(),
  }))

  return [...staticPages, ...blogPages]
}
