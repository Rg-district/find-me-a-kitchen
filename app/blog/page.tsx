import { getAllPosts } from '@/lib/blog'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Food Business Guides & Resources | Find Me a Kitchen',
  description: 'Expert guides for UK food businesses. Kitchen rental costs, dark kitchens vs shared kitchens, street food markets, festival trading and more.',
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Nav */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <Link href="/match" className="text-sm text-gray-600 hover:text-gray-900">Find a Kitchen →</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Resources</p>
          <h1
            className="text-3xl md:text-4xl text-gray-900 mb-3 leading-tight"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
          >
            Food Business Guides
          </h1>
          <p className="text-gray-500 text-sm">
            Practical advice for UK food businesses — from finding your first kitchen to trading at festivals.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm">No articles yet — check back soon.</p>
        ) : (
          <div className="space-y-8">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">{post.category}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h2
                    className="text-xl text-gray-900 mb-2 leading-snug group-hover:text-gray-700 transition-colors"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <p className="mt-3 text-sm text-gray-900 font-medium group-hover:underline">
                    Read guide →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">Ready to find your kitchen?</p>
          <Link
            href="/match"
            className="inline-block bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Start matching →
          </Link>
        </div>
      </main>
    </div>
  )
}
