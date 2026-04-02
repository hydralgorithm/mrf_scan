import { ReactNode, useEffect, useRef, useState } from 'react'

type MagicBentoPanelProps = {
  children: ReactNode
  className?: string
  textAutoHide?: boolean
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  spotlightRadius?: number
  particleCount?: number
  glowColor?: string
  disableAnimations?: boolean
}

type FxDot = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
}

const parseGlow = (glowColor: string): string => {
  const cleaned = glowColor.replace(/\s+/g, '')
  return /^\d+,\d+,\d+$/.test(cleaned) ? cleaned : '132,0,255'
}

export default function MagicBentoPanel({
  children,
  className = '',
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = 400,
  particleCount = 12,
  glowColor = '132, 0, 255',
  disableAnimations = false
}: MagicBentoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const [isHover, setIsHover] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0, nx: 0, ny: 0 })
  const [stars, setStars] = useState<FxDot[]>([])
  const [ripples, setRipples] = useState<FxDot[]>([])
  const glow = parseGlow(glowColor)

  useEffect(() => {
    if (!isHover || disableAnimations) return

    const interval = window.setInterval(() => {
      if (!enableStars) return
      if (!panelRef.current) return
      if (stars.length >= particleCount) return

      const rect = panelRef.current.getBoundingClientRect()
      const id = ++idRef.current
      const star: FxDot = {
        id,
        x: mouse.x,
        y: mouse.y,
        dx: (Math.random() - 0.5) * 24,
        dy: (Math.random() - 0.5) * 24,
        size: 2 + Math.random() * 3
      }

      setStars(prev => [...prev, star])
      window.setTimeout(() => {
        setStars(prev => prev.filter(s => s.id !== id))
      }, 700)

      if (rect.width === 0 || rect.height === 0) {
        setStars([])
      }
    }, 80)

    return () => window.clearInterval(interval)
  }, [isHover, disableAnimations, enableStars, particleCount, mouse.x, mouse.y, stars.length])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const nx = (x / rect.width) * 2 - 1
    const ny = (y / rect.height) * 2 - 1
    setMouse({ x, y, nx, ny })
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickEffect || disableAnimations || !panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++idRef.current
    const ripple: FxDot = {
      id,
      x,
      y,
      dx: 0,
      dy: 0,
      size: Math.max(rect.width, rect.height) * 1.2
    }
    setRipples(prev => [...prev, ripple])
    window.setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 700)
  }

  const tilt = disableAnimations || !enableTilt
    ? 'none'
    : `perspective(1000px) rotateX(${(-mouse.ny * 5).toFixed(2)}deg) rotateY(${(mouse.nx * 5).toFixed(2)}deg)`

  const magnetX = disableAnimations || !enableMagnetism ? 0 : mouse.nx * 4
  const magnetY = disableAnimations || !enableMagnetism ? 0 : mouse.ny * 4

  return (
    <div
      ref={panelRef}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false)
        setStars([])
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl border border-[rgba(147,100,221,0.26)] ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(17, 12, 31, 0.92), rgba(10, 7, 20, 0.95))',
        boxShadow: isHover
          ? `0 16px 36px rgba(10, 8, 18, 0.62), 0 0 22px rgba(${glow}, 0.28)`
          : '0 12px 30px rgba(8, 5, 18, 0.6)',
        transform: `${tilt} translate(${magnetX}px, ${magnetY}px)`,
        transition: 'transform 140ms ease-out, box-shadow 220ms ease-out'
      }}
    >
      {enableSpotlight && !disableAnimations && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            opacity: isHover ? 1 : 0,
            transition: 'opacity 180ms ease-out',
            background: `radial-gradient(${spotlightRadius}px circle at ${mouse.x}px ${mouse.y}px, rgba(${glow}, 0.16), rgba(${glow}, 0.08) 28%, rgba(${glow}, 0.03) 45%, transparent 70%)`
          }}
        />
      )}

      {enableBorderGlow && !disableAnimations && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
          style={{
            border: `1px solid rgba(${glow}, ${isHover ? 0.72 : 0.26})`,
            boxShadow: `inset 0 0 0 1px rgba(${glow}, ${isHover ? 0.2 : 0.08})`
          }}
        />
      )}

      {!disableAnimations && stars.map(star => (
        <span
          key={`star-${star.id}`}
          className="pointer-events-none absolute z-[1] rounded-full"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            background: `rgba(${glow}, 1)`,
            boxShadow: `0 0 10px rgba(${glow}, 0.8)`,
            transform: `translate(${star.dx}px, ${star.dy}px)`,
            opacity: 0,
            animation: 'magic-bento-star 700ms ease-out forwards'
          }}
        />
      ))}

      {!disableAnimations && ripples.map(ripple => (
        <span
          key={`ripple-${ripple.id}`}
          className="pointer-events-none absolute z-[1] rounded-full"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            background: `radial-gradient(circle, rgba(${glow}, 0.38) 0%, rgba(${glow}, 0.18) 30%, transparent 70%)`,
            opacity: 0,
            transform: 'scale(0.08)',
            animation: 'magic-bento-ripple 700ms ease-out forwards'
          }}
        />
      ))}

      <div className={`relative z-10 ${textAutoHide ? 'min-w-0' : ''}`}>{children}</div>
    </div>
  )
}
