import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  targetKeywords: string
  date: string
  readTime: string
  category: string
  excerpt: string
  content: string
  published: boolean
}

function extractFrontmatterFromBody(content: string, slug: string): Partial<BlogPost> {
  // Extract meta fields from the markdown body (our format uses **Meta Title:** etc.)
  const metaTitleMatch = content.match(/\*\*Meta Title:\*\*\s*(.+)/i)
  const metaDescMatch = content.match(/\*\*Meta Description:\*\*\s*(.+)/i)
  const targetKwMatch = content.match(/\*\*Target Keywords:\*\*\s*(.+)/i)
  const wordCountMatch = content.match(/\*\*Word Count:\*\*\s*(.+)/i)

  // Extract first H1 as title
  const h1Match = content.match(/^#\s+(.+)/m)
  const title = h1Match ? h1Match[1] : slug.replace(/-/g, ' ')

  // Extract first paragraph as excerpt (skip meta block lines)
  const lines = content.split('\n')
  let excerpt = ''
  let pastMeta = false
  for (const line of lines) {
    if (line.startsWith('---')) { pastMeta = true; continue }
    if (!pastMeta) continue
    if (line.startsWith('**Meta') || line.startsWith('**Target') || line.startsWith('**Word')) continue
    if (line.trim().length > 60 && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('-')) {
      excerpt = line.replace(/\*\*/g, '').replace(/\*/g, '').trim()
      break
    }
  }

  const wordCount = wordCountMatch ? parseInt(wordCountMatch[1].replace(/[^0-9]/g, '')) || 2000 : 2000
  const readTime = `${Math.ceil(wordCount / 200)} min read`

  return {
    title,
    metaTitle: metaTitleMatch ? metaTitleMatch[1].trim() : title,
    metaDescription: metaDescMatch ? metaDescMatch[1].trim() : excerpt.slice(0, 160),
    targetKeywords: targetKwMatch ? targetKwMatch[1].trim() : '',
    readTime,
    excerpt: excerpt.slice(0, 200) + (excerpt.length > 200 ? '...' : ''),
  }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))

  const posts = files.map(filename => {
    const slug = filename.replace('.md', '')
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8')
    const { data, content } = matter(raw)

    const extracted = extractFrontmatterFromBody(raw, slug)

    return {
      slug,
      title: data.title || extracted.title || slug,
      metaTitle: data.metaTitle || extracted.metaTitle || '',
      metaDescription: data.metaDescription || extracted.metaDescription || '',
      targetKeywords: data.targetKeywords || extracted.targetKeywords || '',
      date: data.date || '2026-03-17',
      readTime: data.readTime || extracted.readTime || '5 min read',
      category: data.category || 'Kitchen Guides',
      excerpt: data.excerpt || extracted.excerpt || '',
      content: raw,
      published: data.published !== false, // default to published
    } as BlogPost
  })

  return posts.filter(p => p.published).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data } = matter(raw)
  const extracted = extractFrontmatterFromBody(raw, slug)

  return {
    slug,
    title: data.title || extracted.title || slug,
    metaTitle: data.metaTitle || extracted.metaTitle || '',
    metaDescription: data.metaDescription || extracted.metaDescription || '',
    targetKeywords: data.targetKeywords || extracted.targetKeywords || '',
    date: data.date || '2026-03-17',
    readTime: data.readTime || extracted.readTime || '5 min read',
    category: data.category || 'Kitchen Guides',
    excerpt: data.excerpt || extracted.excerpt || '',
    content: raw,
    published: data.published !== false,
  }
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
}
