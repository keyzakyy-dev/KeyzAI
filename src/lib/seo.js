import { useEffect } from 'react'

export const SITE_URL = 'https://keyz-ai.vercel.app'
export const SITE_NAME = 'KeyzAI'
export const SITE_DESC =
  'KeyzAI adalah teman chat AI gratis. Masuk dengan Google, brainstorming ide, tulis kode, debug, pelajari topik baru, dan riwayat percakapanmu tersinkron di semua perangkat.'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applyPageMeta({ title, description = SITE_DESC, path = '/' }) {
  const canonical = new URL(path, SITE_URL).toString()
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME

  document.title = fullTitle
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('name', 'twitter:title', fullTitle)
  upsertMeta('name', 'twitter:description', description)
  upsertLink('canonical', canonical)
}

export function usePageMeta(props) {
  useEffect(() => {
    applyPageMeta(props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.title, props.description, props.path])
}

export function injectJsonLd(data) {
  const existing = document.head.querySelector('script[data-seo-jsonld]')
  if (existing) existing.remove()
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.dataset.seoJsonld = ''
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
  return script
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}