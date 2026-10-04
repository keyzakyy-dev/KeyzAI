import logoDark from '../assets/logo.png'
import logoLight from '../assets/logo-light.png'

// Logo KeyzAI versi tema: terang untuk dark, coklat gelap untuk light.
// Swap via CSS (dark:hidden) agar sinkron dengan toggle tema tanpa state JS.
export function LogoImg({ className = '' }) {
  return (
    <>
      <img src={logoLight} alt="KeyzAI" className={`dark:hidden ${className}`} />
      <img src={logoDark} alt="KeyzAI" className={`hidden dark:block ${className}`} />
    </>
  )
}

// Wordmark teks: KEYZ mengikuti tema (putih di dark, gelap di light) + AI merah.
export function Wordmark({ className = '' }) {
  return (
    <span className={`text-2xl font-bold tracking-tight text-foreground ${className}`}>
      KEYZ<span className="text-red-500">AI</span>
    </span>
  )
}
