import { getPostBySlug, getAllSlugs } from '@/lib/blog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription,
    keywords: post.targetKeywords,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

// Convert markdown to clean HTML (lightweight, no heavy dependency needed)
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Strip meta comment block at the top (lines starting with ** before the first ---)
  html = html.replace(/^\*\*Meta Title:\*\*.*\n/gm, '')
  html = html.replace(/^\*\*Meta Description:\*\*.*\n/gm, '')
  html = html.replace(/^\*\*Target Keywords:\*\*.*\n/gm, '')
  html = html.replace(/^\*\*Word Count:\*\*.*\n/gm, '')

  // Remove horizontal rules used as section dividers
  html = html.replace(/^---+\n/gm, '')

  // Tables
  html = html.replace(/(\|.+\|\n)+/g, (table) => {
    const rows = table.trim().split('\n')
    const headerRow = rows[0]
    const bodyRows = rows.slice(2) // skip separator row

    const headers = headerRow.split('|').filter(c => c.trim()).map(c =>
      `<th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 border-b border-gray-200">${c.trim()}</th>`
    ).join('')

    const body = bodyRows.map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c =>
        `<td class="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">${procesInline(c.trim())}</td>`
      ).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    return `<div class="overflow-x-auto my-6 rounded-xl border border-gray-200"><table class="w-full"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`
  })

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (block) => {
    const code = block.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
    return `<pre class="bg-gray-50 border border-gray-200 rounded-xl p-4 my-6 text-sm text-gray-700 overflow-x-auto"><code>${code}</code></pre>`
  })

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-gray-800 mt-6 mb-2">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3" style="font-family:Georgia,serif">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4 pt-4 border-t border-gray-100" style="font-family:Georgia,serif;font-style:italic">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '') // Skip H1 — we render title separately

  // Unordered lists
  html = html.replace(/((?:^[*-] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line => {
      const text = line.replace(/^[*-] /, '')
      return `<li class="text-gray-700 text-sm leading-relaxed">${procesInline(text)}</li>`
    }).join('')
    return `<ul class="list-none space-y-1.5 my-4 pl-0">${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line => {
      const text = line.replace(/^\d+\. /, '')
      return `<li class="text-gray-700 text-sm leading-relaxed">${procesInline(text)}</li>`
    }).join('')
    return `<ol class="list-decimal list-inside space-y-1.5 my-4 pl-0">${items}</ol>`
  })

  // Paragraphs (lines with content not already tagged)
  const lines = html.split('\n')
  const processed: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      processed.push('')
      continue
    }
    if (trimmed.startsWith('<')) {
      processed.push(trimmed)
      continue
    }
    processed.push(`<p class="text-gray-700 text-base leading-relaxed my-3">${procesInline(trimmed)}</p>`)
  }
  html = processed.join('\n')

  return html
}

function procesInline(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
  // Inline code
  text = text.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">$1</code>')
  // Links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-gray-900 underline underline-offset-2 hover:text-gray-600">$1</a>')
  // Emoji checkmarks and crosses — make them stand out
  text = text.replace(/✅/g, '<span class="text-green-500">✅</span>')
  text = text.replace(/❌/g, '<span class="text-red-400">❌</span>')
  return text
}

export default function BlogPost({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const htmlContent = markdownToHtml(post.content)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Nav */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <Link href="/match" className="text-sm text-gray-600 hover:text-gray-900">Find a Kitchen →</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href="/blog" className="hover:text-gray-600">Guides</Link>
          <span>→</span>
          <span>{post.category}</span>
        </div>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400 uppercase tracking-widest">{post.category}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">{post.readTime}</span>
          </div>
          <h1
            className="text-3xl md:text-4xl text-gray-900 leading-tight mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
          >
            {post.title}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {post.metaDescription}
          </p>
        </header>

        {/* Article Body */}
        <article
          className="prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* CTA */}
        <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p
            className="text-xl text-gray-900 mb-2"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Ready to find your perfect kitchen?
          </p>
          <p className="text-gray-500 text-sm mb-5">Answer a few questions and we'll match you with the right space.</p>
          <Link
            href="/match"
            className="inline-block bg-gray-900 text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Start matching — free →
          </Link>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-600">
            ← All guides
          </Link>
        </div>
      </main>
    </div>
  )
}
