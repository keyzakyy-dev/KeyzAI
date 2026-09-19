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
