/**
 * Smoke render: render halaman publik di Node (react-dom/server) untuk
 * menangkap error fase render (identifier tak terdefinisi, typo komponen,
 * dll) yang lolos dari vite build & test logika murni.
 *
 * Bundling memakai vite JS API (sudah devDep) dengan out sementara di
 * node_modules/.keyzai-smoke agar bare import (react, dll) resolve.
 * Tanpa dependency baru.
 */
import assert from 'node:assert/strict'
import { writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'node_modules', '.keyzai-smoke')
const entryPath = path.join(outDir, 'entry.jsx')

const entry = `
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import assert from 'node:assert/strict'
import { LandingPage } from '${path.join(root, 'src/pages/LandingPage.jsx').replaceAll('\\', '/')}'
import { PrivacyPage, TermsPage } from '${path.join(root, 'src/pages/LegalPage.jsx').replaceAll('\\', '/')}'
import { ChatMock } from '${path.join(root, 'src/components/ChatMock.jsx').replaceAll('\\', '/')}'

const cases = {
  'landing': h(LandingPage),
  'privacy': h(PrivacyPage),
  'terms': h(TermsPage),
  'chat-mockup': h(ChatMock),
}
for (const [name, el] of Object.entries(cases)) {
  const wrapped = name === 'chat-mockup' ? el : h(MemoryRouter, { initialEntries: ['/'] }, el)
  const html = renderToString(wrapped)
  assert(html && html.length > 100, name + ': render kosong')
}
console.log('smoke render (landing, legal, mockup): OK')
`

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(entryPath, entry)

try {
  await build({
    configFile: false,
    root,
    logLevel: 'silent',
    resolve: { alias: { '@': path.join(root, 'src') } },
    build: {
      ssr: entryPath,
      outDir,
      emptyOutDir: false,
      minify: false,
    },
  })
  await import(pathToFileURL(path.join(outDir, 'entry.js')).href)
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
