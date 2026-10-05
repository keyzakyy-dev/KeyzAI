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

// Wordmark teks: KEYZ mengikuti tema (putih di dark, gelap di light) + AI kuning.
// Ukuran ditetapkan pemanggil via className (default text-xl untuk navbar).
export function Wordmark({ className = 'text-xl' }) {
  return (
    <span className={`font-medium tracking-[0.16em] text-foreground ${className}`}>
      KEYZ<span className="text-yellow-600 dark:text-yellow-400">AI</span>
    </span>
  )
}
