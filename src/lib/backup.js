/**
 * Backup percakapan ke file JSON. localStorage bisa penuh diam-diam (quota) dan
 * hapus percakapan tidak punya undo di storage level — export ini jadi satu-satunya
 * jaring pengaman data pengguna.
 */

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadConversation(conv) {
  if (!conv) return
  download(`keyzai-${stamp()}.json`, conv)
}

export function downloadAll(conversations) {
  if (!Array.isArray(conversations) || conversations.length === 0) return
  download(`keyzai-backup-${stamp()}.json`, {
    exportedAt: new Date().toISOString(),
    conversations,
  })
}
