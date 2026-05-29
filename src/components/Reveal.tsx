import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

interface RevealProps {
  children: ReactNode
  /** Stagger delay in ms (applied via the --reveal-delay CSS var). */
  delay?: number
  className?: string
}

/**
 * Reveals its children with a bold pop-in (fade + slide-up + slight scale, with
 * an overshoot ease) the first time they scroll into view (or immediately, if
 * already in view on mount). Dependency-free IntersectionObserver. Honors
 * prefers-reduced-motion by showing content instantly with no transform.
 *
 * Pairs with the `.reveal` / `.is-revealed` motion CSS in index.css.
 *
 * Usage:
 *   <Reveal>...</Reveal>
 *   <Reveal delay={130}>...</Reveal>   // stagger siblings: 0, 130, 260, ...
 */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reduced-motion: show instantly, no observer, no transform.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'is-revealed' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
