import { useEffect } from 'react'

export const SITE_URL = 'https://chat.keyzakyy.com'
export const SITE_NAME = 'KeyzAI'
export const SITE_DESC =
  'KeyzAI — teman chat AI gratis tanpa kartu kredit. Chat streaming dengan Google login, multi-model AI, riwayat tersinkron, PRD Builder, dan banyak lagi.'

const DEFAULT_TITLE = SITE_NAME
const DEFAULT_DESC = SITE_DESC

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

function upsertScript(type, value) {
  let el = document.head.querySelector(`script[type="${type}"]`)
  if (!value) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', type)
    document.head.appendChild(el)
  }
  el.textContent = value
}

export function applyPageMeta({
  title,
  description = DEFAULT_DESC,
  path = '/',
  robots = 'index, follow',
  imageUrl,
}) {
  const canonical = new URL(path, SITE_URL).toString()
  const fullTitle = title && title !== DEFAULT_TITLE ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE

  document.title = fullTitle
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_NAME)
  if (imageUrl) {
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
  }
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', fullTitle)
  upsertMeta('name', 'twitter:description', description)
  if (imageUrl) upsertMeta('name', 'twitter:image', imageUrl)
  upsertMeta('name', 'robots', robots)
  upsertLink('canonical', canonical)

  // JSON-LD structured data per halaman untuk rich snippet
  const schemaPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonical,
    url: canonical,
    name: fullTitle,
    description,
    inLanguage: 'id',
    ...(imageUrl ? { image: imageUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
  if (path === '/') {
    // Halaman utama: gabung dengan schema WebSite yang sudah ada di index.html
    schemaPage.description =
      'Platform chat AI gratis untuk developer dan umum. Multi-model AI, streaming respons, riwayat tersinkron antar perangkat, dan PRD Builder.'
    schemaPage.url = SITE_URL
    upsertScript('application/ld+json', JSON.stringify(schemaPage, null, 2))
  } else if (path === '/changelog') {
    schemaPage.dateCreated = new Date().toISOString().slice(0, 10)
    upsertScript('application/ld+json', JSON.stringify(schemaPage, null, 2))
  } else {
    upsertScript('application/ld+json', JSON.stringify(schemaPage, null, 2))
  }
}

export function usePageMeta(props) {
  useEffect(() => {
    applyPageMeta(props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.title, props.description, props.path, props.robots, props.imageUrl])
}
