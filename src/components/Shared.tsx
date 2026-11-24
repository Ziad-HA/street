import { Suspense, lazy, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ASSETS, BRAND } from '../config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from '../mark'
import type { Pose } from '../Logo3D'
import { ErrorBoundary } from './ErrorBoundary'

const Logo3DInner = lazy(() => import('../Logo3D'))

export function Img({
  src,
  className,
  style,
  alt = '',
}: {
  src?: string
  className?: string
  style?: CSSProperties
  alt?: string
}) {
  if (!src) {
    return <div className={`img ${className ?? ''}`} style={style} />
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`img ${className ?? ''}`}
      style={style}
    />
  )
}

export function RotatingProductImage({ images, alt = '' }: { images: string[]; alt?: string }) {
  const [index, setIndex] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  useEffect(() => {
    if (images.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % images.length
        setPrevious(current)
        return next
      })
    }, 3600)
    return () => window.clearInterval(timer)
  }, [images])
  return (
    <div className="outfit-rotating-image">
      {previous !== null && (
        <Img
          src={images[previous]}
          alt={alt}
          key={`outfit-prev-${previous}`}
          className="outfit-image-previous"
        />
      )}
      <Img
        src={images[index] ?? images[0]}
        alt={alt}
        key={`outfit-current-${index}`}
        className="outfit-image-current"
      />
    </div>
  )
}

function smooth(st: [number, number][]): string {
  if (st.length < 3) return `M${st.map((p) => p.join(' ')).join(' L')}`
  let d = `M${st[0][0]} ${st[0][1]}`
  for (let i = 0; i < st.length - 1; i++) {
    const p0 = st[Math.max(0, i - 1)]
    const p1 = st[i]
    const p2 = st[i + 1]
    const p3 = st[Math.min(st.length - 1, i + 2)]
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`
  }
  return d
}

export function Logo({ className }: { className?: string }) {
  if (ASSETS.logo) return <img className={className} src={ASSETS.logo} alt={BRAND} />
  const pad = 6
  return (
    <svg
      className={`mark ${className ?? ''}`}
      viewBox={`${-pad} ${-pad} ${MARK_W + pad * 2} ${MARK_H + pad * 2}`}
      role="img"
      aria-label={BRAND}
    >
      {STROKES.map((st, i) => (
        <path key={i} d={smooth(st)} strokeWidth={MARK_STROKE} />
      ))}
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

export function LazyLogo3D({
  className,
  fov,
  pose,
  pointer,
  spin,
  scrollSpin,
}: {
  className?: string
  fov?: number
  pose: Pose
  pointer?: boolean
  spin?: number
  scrollSpin?: boolean
}) {
  const fallback = <Logo className={className} />
  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Logo3DInner
          className={className}
          fov={fov}
          pose={pose}
          pointer={pointer}
          spin={spin}
          scrollSpin={scrollSpin}
        />
      </Suspense>
    </ErrorBoundary>
  )
}

export const Pay = () => (
  <div className="pay">
    <span>PAYMENT OPTIONS WILL BE CONFIRMED AT CHECKOUT</span>
  </div>
)
