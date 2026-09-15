import { useEffect, useRef } from 'react'

export function useReveal(options) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-revealed', '')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-revealed', '')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px', ...options }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

export function Reveal({
  as: Tag = 'div',
  from = 'up',
  delay = 0,
  duration,
  className = '',
  children,
  ...rest
}) {
  const ref = useReveal()
  const style = {
    '--reveal-delay': `${delay}ms`,
    ...(duration ? { '--reveal-duration': `${duration}ms` } : null),
  }
  return (
    <Tag ref={ref} data-reveal={from} style={style} className={className} {...rest}>
      {children}
    </Tag>
  )
}
