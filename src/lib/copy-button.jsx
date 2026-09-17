import { useState } from 'react'
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons'

import { cn } from './utils'

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // non-secure context / old browser fallback
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function CopyButton({ text, withLabel = false, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Tersalin' : 'Salin'}
      className={cn(
        'flex items-center gap-1 rounded p-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className
      )}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {withLabel && <span>{copied ? 'Tersalin' : 'Salin'}</span>}
    </button>
  )
}
