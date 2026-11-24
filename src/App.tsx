import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { CSSProperties } from 'react'
import { Logo3D } from './Logo3D'
import { ANNOUNCEMENTS, ASSETS, BRAND } from './config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from './mark'
import { CATEGORIES, PRODUCTS } from './data'
import type { Category, Product } from './data'
import './App.css'
import { supabase, supabasePublic } from './lib/supabase'

type Page = 'intro' | 'hero' | 'store' | 'collections' | 'collection' | 'product' | 'studio' | 'contact' | 'help' | 'wishlist' | 'track' | 'new-arrivals' | 'best-sellers' | 'lookbook' | 'build-outfit' | 'size-guide' | 'checkout' | 'account' | 'admin' | 'purchase-terms' | 'style-terms' | 'privacy' | 'cookies' | 'ai-terms' | 'sitemap' | 'cookie-settings' | 'market-language'

interface CartItem {
  product: Product
  size: string
  qty: number
}

const NAV: { label: string; page: Page }[] = [
  { label: 'HOME', page: 'hero' },
  { label: 'SHOP', page: 'store' },
  { label: 'COLLECTIONS', page: 'collections' },
  { label: 'STUDIO', page: 'studio' },
  { label: 'CONTACT', page: 'contact' },
]

function Img({ src, className, style }: { src?: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`img ${className ?? ''}`}
      style={{ ...style, backgroundImage: src ? `url(${src})` : undefined }}
    />
  )
}


function RotatingProductImage({ images }: { images: string[] }) {
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
      {previous !== null && <Img src={images[previous]} key={`outfit-prev-${previous}`} className="outfit-image-previous" />}
      <Img src={images[index] ?? images[0]} key={`outfit-current-${index}`} className="outfit-image-current" />
    </div>
  )
}

function smooth(st: [number, number][]): string {
  if (st.length < 3) return `M${st.map((p) => p.join(' ')).join(' L')}`
  let d = `M${st[0][0]} ${st[0][1]}`
  for (let i = 0; i < st.length - 1; i++) {
    const p0 = st[Math.max(0, i - 1)], p1 = st[i], p2 = st[i + 1], p3 = st[Math.min(st.length - 1, i + 2)]
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`
  }
  return d
}

function Logo({ className }: { className?: string }) {
  if (ASSETS.logo) return <img className={className} src={ASSETS.logo} alt={BRAND} />
  const pad = 6
  return (
    <svg className={`mark ${className ?? ''}`} viewBox={`${-pad} ${-pad} ${MARK_W + pad * 2} ${MARK_H + pad * 2}`} role="img" aria-label={BRAND}>
      {STROKES.map((st, i) => (
        <path key={i} d={smooth(st)} strokeWidth={MARK_STROKE} />
      ))}
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

const PRICE_RANGES: Record<Category, { min: number; max: number; default: number }> = {
  JACKETS: { min: 2000, max: 3200, default: 2790 },
  PANTS: { min: 900, max: 1800, default: 1290 },
  'T-SHIRTS': { min: 800, max: 1500, default: 990 },
  HOODIES: { min: 1200, max: 1700, default: 1490 },
  CAPS: { min: 200, max: 600, default: 390 },
}
const money = (n: number) => n > 0 ? `EGP ${Math.round(n).toLocaleString('en-EG')}` : 'PRICE UNAVAILABLE'
const moneyValue = (n: number) => `EGP ${Math.round(n).toLocaleString('en-EG')}`
const defaultPriceFor = (category: Category) => PRICE_RANGES[category].default
const categoryLabel = (c: Category) => ({ PANTS: 'PANTS', JACKETS: 'JACKETS', HOODIES: 'HOODIES', 'T-SHIRTS': 'T-SHIRTS', CAPS: 'CAPS' })[c]

const EMPTY_PRODUCT: Product = { id: '', name: 'PRODUCT DETAILS', category: 'HOODIES', price: 0, sizes: [], color: '#eeeeee', images: [], details: [] }

const Icon = {
  search: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z" /></svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10Z" /></svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5 5 19" /></svg>
  ),
}

const Pay = () => <div className="pay"><span>PAYMENT OPTIONS WILL BE CONFIRMED AT CHECKOUT</span></div>

function readStored<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }

function routeFromLocation(): { page: Page; category?: Category; product?: Product } {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'shop') return { page: 'store' }
  if (parts[0] === 'collections' && parts[1]) {
    const category = CATEGORIES.find((item) => item.toLowerCase() === decodeURIComponent(parts[1]).toLowerCase())
    return category ? { page: 'collection', category } : { page: 'collections' }
  }
  if (parts[0] === 'collections') return { page: 'collections' }
  if (parts[0] === 'product' && parts[1]) {
    const id = decodeURIComponent(parts[1])
    const product = PRODUCTS.find((item) => item.id === id)
    if (product) return { page: 'product', product, category: product.category }
    const category = CATEGORIES.find((item) => id.startsWith(`${item.toLowerCase().replace(/\s+/g, '-')}-`)) ?? 'HOODIES'
    const placeholder: Product = { id, name: 'PRODUCT DETAILS', category, price: 0, sizes: [], images: [], color: '#292929', details: [] }
    return { page: 'product', product: placeholder, category }
  }
  if (parts[0] === 'studio') return { page: 'studio' }
  if (parts[0] === 'contact') return { page: 'contact' }
  if (parts[0] === 'help') return { page: 'help' }
  if (['purchase-terms','style-terms','privacy','cookies','ai-terms','sitemap','cookie-settings','market-language'].includes(parts[0])) return { page: parts[0] as Page }
  if (parts[0] === 'wishlist') return { page: 'wishlist' }
  if (parts[0] === 'track') return { page: 'track' }
  if (['new-arrivals','best-sellers','lookbook','build-outfit','size-guide','checkout','account','admin'].includes(parts[0])) return { page: parts[0] as Page }
  if (parts.length === 0) {
    try { return { page: localStorage.getItem('street-intro-seen-v1') === '1' ? 'hero' : 'intro' } }
    catch { return { page: 'intro' } }
  }
  return { page: 'hero' }
}

function pathForPage(page: Page, category?: Category): string {
  if (page === 'hero' || page === 'intro') return '/'
  if (page === 'store') return '/shop'
  if (page === 'collections') return '/collections'
  if (page === 'collection') return category ? `/collections/${encodeURIComponent(category.toLowerCase())}` : '/collections'
  return `/${page}`
}

export default function App() {
  const initialRoute = routeFromLocation()
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(PRODUCTS)
  const [catalogReady, setCatalogReady] = useState(false)
  const [page, setPage] = useState<Page>(initialRoute.page)
  const [scene, setScene] = useState(0)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => readStored<CartItem[]>('street-cart-v2', []))
  const [wish, setWish] = useState<string[]>(() => readStored<string[]>('street-wishlist-v2', []))
  const [category, setCategory] = useState<Category>(initialRoute.category ?? initialRoute.product?.category ?? 'HOODIES')
  const [showAllShopProducts, setShowAllShopProducts] = useState(false)
  const [sizeFilter, setSizeFilter] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [quickViewSize, setQuickViewSize] = useState('')
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured')
  const [recentIds, setRecentIds] = useState<string[]>(() => readStored<string[]>('street-recently-viewed-v2', []))
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [active, setActive] = useState<Product>(initialRoute.product ?? catalogProducts[0] ?? EMPTY_PRODUCT)
  const [ann, setAnn] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [dark, setDark] = useState(false)
  const clickAudio = useRef<AudioContext | null>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const pending = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!quickView) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setQuickView(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [quickView])

  useEffect(() => { localStorage.setItem('street-cart-v2', JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user?.email) setCheckoutEmail((current) => current || data.user!.email!)
    })
    return () => { active = false }
  }, [])
  useEffect(() => { localStorage.setItem('street-wishlist-v2', JSON.stringify(wish)) }, [wish])
  useEffect(() => { localStorage.setItem('street-recently-viewed-v2', JSON.stringify(recentIds)) }, [recentIds])

  useEffect(() => {
    let alive = true
    const loadCatalogPrices = async () => {
      const [{ data, error }, { data: stockRows }] = await Promise.all([
        supabasePublic.from('products').select('id,name,category,price,is_active,images,sizes,color,description,created_at').eq('is_active', true).order('created_at', { ascending: false }),
        supabasePublic.from('inventory').select('product_id,size,quantity'),
      ])
      if (!alive) return
      if (error || !data) { setCatalogReady(true); return }
      const stockByProduct = new Map<string, Record<string, number>>()
      ;(stockRows ?? []).forEach((row) => {
        const current = stockByProduct.get(row.product_id) ?? {}
        current[row.size] = Number(row.quantity) || 0
        stockByProduct.set(row.product_id, current)
      })
      const next: Product[] = data.map((row) => {
        const storedStock = stockByProduct.get(row.id) ?? {}
        const stockBySize = Object.fromEntries((row.sizes ?? []).map((size: string) => [size, storedStock[size] ?? 0]))
        const soldOut = (row.sizes ?? []).every((size: string) => stockBySize[size] <= 0)
        return {
          id: row.id,
          name: row.name,
          category: row.category as Category,
          price: row.price == null ? defaultPriceFor(row.category as Category) : Number(row.price),
          sizes: row.sizes ?? [],
          images: row.images ?? [],
          color: row.color ?? '#292929',
          stockBySize,
          soldOut,
          details: row.description ? [row.description] : [],
        }
      })
      setCatalogProducts(next)
      setCatalogReady(true)
      setCart((items) => items.map((item) => {
        const current = next.find((product) => product.id === item.product.id)
        return current ? { ...item, product: current } : item
      }))
      const matchedInitialProduct = initialRoute.product ? next.find((product) => product.id === initialRoute.product?.id) : undefined
      setActive((current) => next.find((product) => product.id === current.id) ?? next[0] ?? current)
      if (matchedInitialProduct) {
        setActive(matchedInitialProduct)
        setCategory(matchedInitialProduct.category)
        setSizeSel(matchedInitialProduct.sizes[0] ?? '')
        setQty(1)
      }
      if (initialRoute.page === 'product' && initialRoute.product && !next.some((product) => product.id === initialRoute.product?.id)) {
        setPage('store')
        window.history.replaceState({}, '', '/shop')
      }
    }
    void loadCatalogPrices()
    return () => { alive = false }
  }, [])


  // Always start a fresh page load at the top, even on a deep product URL.
  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)
    window.addEventListener('pageshow', resetScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pageshow', resetScroll)
    }
  }, [])

  // Keep the visible page in sync with real browser URLs (back/forward and direct links).
  useEffect(() => {
    const syncRoute = () => {
      const route = routeFromLocation()
      setPage(route.page)
      if (route.category) setCategory(route.category)
      if (route.product) {
        setActive(route.product)
        setCategory(route.product.category)
        setSizeSel(route.product.sizes[0] ?? '')
        setQty(1)
      }
      setMenu(false)
      setSearch(false)
      setCartOpen(false)
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  // Show the brand intro only once on this browser.
  useEffect(() => {
    try { localStorage.setItem('street-intro-seen-v1', '1') } catch { /* storage may be unavailable */ }
  }, [])

  // intro -> hero
  useEffect(() => {
    if (page !== 'intro') return
    const t = setTimeout(() => setPage('hero'), 2400)
    return () => clearTimeout(t)
  }, [page])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setAnn((a) => (a + 1) % ANNOUNCEMENTS.length), 4500)
    return () => clearInterval(t)
  }, [])

  // Short mechanical calculator-key sound on every click.
  useEffect(() => {
    const playKeySound = () => {
      try {
        const AudioContextClass = window.AudioContext
        if (!AudioContextClass) return
        const ctx = clickAudio.current ?? (clickAudio.current = new AudioContextClass())
        if (ctx.state === 'suspended') void ctx.resume()
        const now = ctx.currentTime

        const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate)
        const noiseData = noiseBuffer.getChannelData(0)
        for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length)
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(900, now)
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.28, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)
        noise.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noise.start(now)
        noise.stop(now + 0.026)

        const tone = ctx.createOscillator()
        const toneGain = ctx.createGain()
        tone.type = 'square'
        tone.frequency.setValueAtTime(1180, now)
        tone.frequency.exponentialRampToValueAtTime(820, now + 0.035)
        toneGain.gain.setValueAtTime(0.11, now)
        toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        tone.connect(toneGain)
        toneGain.connect(ctx.destination)
        tone.start(now)
        tone.stop(now + 0.042)
      } catch {
        // Audio may be unavailable or blocked by the browser.
      }
    }
    document.addEventListener('click', playKeySound, true)
    return () => {
      document.removeEventListener('click', playKeySound, true)
      void clickAudio.current?.close()
      clickAudio.current = null
    }
  }, [])

  // custom cursor follower
  useEffect(() => {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0
    const mv = (e: MouseEvent) => { x = e.clientX; y = e.clientY }
    const loop = () => {
      cx += (x - cx) * 0.18
      cy += (y - cy) * 0.18
      if (cursor.current) cursor.current.style.transform = `translate(${cx}px, ${cy}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', mv)
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', mv); cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const pageNames: Record<Page, string> = {
      intro: 'STREET', hero: 'STREET — Independent Streetwear', store: 'Shop All Pieces — STREET',
      collections: 'Collections — STREET', collection: `${category} — STREET`, product: `${active.name} — STREET`,
      studio: 'The Studio — STREET', contact: 'Contact — STREET', help: 'Help & FAQs — STREET', wishlist: 'Wishlist — STREET',
      'purchase-terms': 'Terms of Purchase — STREET', 'style-terms': 'STREET Style Terms', privacy: 'Privacy Policy — STREET', cookies: 'Cookies Policy — STREET', 'ai-terms': 'Use of AI — STREET', sitemap: 'Sitemap — STREET', 'cookie-settings': 'Cookie Settings — STREET', 'market-language': 'Market & Language — STREET',
      track: 'Order Tracking — STREET', 'new-arrivals': 'New Arrivals — STREET', 'best-sellers': 'The Current Edit — STREET',
      lookbook: 'Lookbook — STREET', 'build-outfit': 'Build Your Outfit — STREET', 'size-guide': 'Size Guide — STREET',
      checkout: 'Checkout — STREET', account: 'Your Account — STREET', admin: 'Store Admin — STREET',
    }
    const descriptions: Partial<Record<Page, string>> = {
      hero: 'Discover STREET: considered everyday streetwear, current collections and pieces made for your own direction.',
      store: 'Shop the STREET catalogue. Explore clothing, check available sizes and build your rotation.',
      collections: 'Explore the latest STREET clothing collections and curated edits.',
      product: `Discover ${active.name} from STREET. View product images, available sizes and details.`,
      help: 'Find answers about STREET orders, payment, stock, accounts and product reviews.',
    }
    document.title = pageNames[page] ?? 'STREET'
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description) }
    description.content = descriptions[page] ?? 'STREET is an independent streetwear project built around movement, utility and personal expression.'
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${window.location.origin}${window.location.pathname}`
    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('property', property); document.head.appendChild(meta) }
      meta.content = content
    }
    setMeta('og:title', document.title)
    setMeta('og:description', description.content)
    setMeta('og:type', 'website')
    setMeta('og:url', canonical.href)
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots) }
    robots.content = ['account', 'admin', 'checkout', 'track', 'wishlist'].includes(page) ? 'noindex, nofollow' : 'index, follow'
  }, [page, category, active.name])

  const go = (p: Page, anchor?: string) => {
    setMenu(false)
    setSearch(false)
    setCartOpen(false)
    pending.current = anchor
    if (p === 'hero') setScene(0)
    const nextPath = pathForPage(p, category)
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath)
    setPage(p)
    window.scrollTo(0, 0)
    requestAnimationFrame(() => {
      if (pending.current) document.getElementById(pending.current)?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const openProduct = (p: Product) => {
    setRecentIds((ids) => [p.id, ...ids.filter((id) => id !== p.id)].slice(0, 8))
    setActive(p)
    setCategory(p.category)
    setSizeSel(p.sizes[0])
    setQty(1)
    setSearch(false)
    window.history.pushState({}, '', `/product/${encodeURIComponent(p.id)}`)
    setPage('product')
    window.scrollTo(0, 0)
  }
  const openCollection = (c: Category) => {
    setCategory(c)
    setSizeFilter(null)
    setSearch(false)
    window.history.pushState({}, '', `/collections/${encodeURIComponent(c.toLowerCase())}`)
    setPage('collection')
    window.scrollTo(0, 0)
  }

  const [sizeSel, setSizeSel] = useState('XS')
  const [qty, setQty] = useState(1)
  const [galleryPaused, setGalleryPaused] = useState(false)
  const [openMaterials, setOpenMaterials] = useState(false)
  const [openDelivery, setOpenDelivery] = useState(false)
  const [cookiePrefs, setCookiePrefs] = useState(() => readStored<{analytics:boolean;marketing:boolean}>('street-cookie-preferences-v1', {analytics:false,marketing:false}))
  const [cookieSaved, setCookieSaved] = useState(false)
  const [trackCode, setTrackCode] = useState('')
  const [trackNotice, setTrackNotice] = useState('')
  const [trackResult, setTrackResult] = useState<{order_number:string;status:string;created_at:string;total:number}|null>(null)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutCity, setCheckoutCity] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutShipping, setCheckoutShipping] = useState<number | null>(null)
  const [checkoutCoupon, setCheckoutCoupon] = useState('')
  const [checkoutCouponCode, setCheckoutCouponCode] = useState('')
  const [checkoutDiscount, setCheckoutDiscount] = useState(0)
  const [checkoutNotice, setCheckoutNotice] = useState('')
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{order_number:string;total:number;guest:boolean}|null>(null)
  const [adminCoupons, setAdminCoupons] = useState<Array<{id:string;code:string;discount_type:'percent'|'fixed';discount_value:number;min_subtotal:number;max_discount:number|null;usage_limit:number|null;per_user_limit:number;used_count:number;is_active:boolean;expires_at:string|null}>>([])
  const [adminReviews, setAdminReviews] = useState<Array<{id:string;product_id:string;rating:number;title:string;body:string;status:string;created_at:string}>>([])
  const [adminShippingDraft, setAdminShippingDraft] = useState('')
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newCouponType, setNewCouponType] = useState<'percent'|'fixed'>('percent')
  const [newCouponValue, setNewCouponValue] = useState('10')
  const [newCouponMin, setNewCouponMin] = useState('0')
  const [newCouponLimit, setNewCouponLimit] = useState('')
  const [newCouponExpiry, setNewCouponExpiry] = useState('')
  const [outfitBottom, setOutfitBottom] = useState(catalogProducts.find((p) => p.category === 'PANTS')?.id ?? '')
  const [outfitTop, setOutfitTop] = useState(catalogProducts.find((p) => p.category === 'HOODIES')?.id ?? '')
  const [accountMode, setAccountMode] = useState<'signin'|'signup'>('signin')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountUser, setAccountUser] = useState<string | null>(null)
  const [accountOrders, setAccountOrders] = useState<Array<{order_number:string;total:number;status:string;created_at:string}>>([])
  const [accountNotice, setAccountNotice] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminNotice, setAdminNotice] = useState('')
  const [adminUser, setAdminUser] = useState<string | null>(null)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [adminOrders, setAdminOrders] = useState<Array<{order_number:string; customer_name:string; total:number; status:string; created_at:string; subtotal:number; shipping_fee:number; discount_amount:number; coupon_code:string|null; payment_method:string|null; payment_status:string}>>([])
  const [adminExportNotice, setAdminExportNotice] = useState('')
  const [adminProducts, setAdminProducts] = useState<Array<{id:string;name:string;category:string;price:number|null;is_active:boolean;sizes:string[];images:string[]}>>([])
  const [adminCustomers, setAdminCustomers] = useState<Array<{email:string|null;full_name:string|null;created_at:string}>>([])
  const [adminPriceDrafts, setAdminPriceDrafts] = useState<Record<string,string>>({})
  const [adminStockDrafts, setAdminStockDrafts] = useState<Record<string,string>>({})
  const [adminImageFiles, setAdminImageFiles] = useState<Record<string,File|null>>({})
  const [newProductName, setNewProductName] = useState('')
  const [newProductCategory, setNewProductCategory] = useState<Category>('PANTS')
  const [newProductPrice, setNewProductPrice] = useState('')


  useEffect(() => {
    if (page !== 'checkout') return
    let alive = true
    const loadCheckoutSession = async () => {
      const [{ data: { user } }, { data: setting }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('store_settings').select('value').eq('key','shipping_fee').maybeSingle(),
      ])
      if (!alive) return
      setCheckoutEmail(user?.email ?? '')
      const fullName = user?.user_metadata?.full_name
      if (typeof fullName === 'string') setCheckoutName(fullName)
      const value = setting?.value
      setCheckoutShipping(value === null || value === undefined ? null : Number(value))
    }
    void loadCheckoutSession()
    return () => { alive = false }
  }, [page])

  useEffect(() => {
    if (page !== 'account') return
    let alive = true
    const loadAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!alive) return
      setAccountUser(session?.user.email ?? null)
      if (!session?.user) return
      const { data: orders } = await supabase.from('orders').select('order_number,total,status,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      if (alive) setAccountOrders(orders ?? [])
      const { data: saved } = await supabase.from('wishlist_items').select('product_id').eq('user_id', session.user.id)
      if (alive && saved) setWish(saved.map((item) => item.product_id))
    }
    void loadAccount()
    return () => { alive = false }
  }, [page])

  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAccountNotice('PLEASE WAIT…')
    if (accountMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: accountEmail.trim(), password: accountPassword, options: { data: { full_name: accountName.trim() }, emailRedirectTo: window.location.origin } })
      if (error) { setAccountNotice(error.message); return }
      if (data.session) { setAccountUser(data.user?.email ?? null); setAccountNotice('ACCOUNT CREATED.') }
      else setAccountNotice('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT, THEN SIGN IN.')
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: accountEmail.trim(), password: accountPassword })
    if (error || !data.user) { setAccountNotice(error?.message ?? 'Unable to sign in.'); return }
    setAccountUser(data.user.email ?? null)
    const { data: orders } = await supabase.from('orders').select('order_number,total,status,created_at').eq('user_id', data.user.id).order('created_at', { ascending: false })
    setAccountOrders(orders ?? [])
    const { data: saved } = await supabase.from('wishlist_items').select('product_id').eq('user_id', data.user.id)
    if (saved) setWish(saved.map((item) => item.product_id))
    setAccountNotice('SIGNED IN.')
  }

  const resendAccountConfirmation = async () => {
    if (!accountEmail.trim()) { setAccountNotice('ENTER YOUR EMAIL ADDRESS FIRST.'); return }
    setAccountNotice('SENDING A NEW CONFIRMATION EMAIL…')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: accountEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setAccountNotice(error ? error.message : 'A NEW CONFIRMATION EMAIL HAS BEEN SENT. USE THE LATEST EMAIL ONLY.')
  }
  const signOutAccount = async () => {
    await supabase.auth.signOut()
    setAccountUser(null)
    setAccountOrders([])
    setAccountNotice('SIGNED OUT.')
  }

  useEffect(() => {
    if (page !== 'admin') return
    let alive = true
    const loadAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!alive) return
      setAdminUser(session?.user.email ?? null)
      if (!session?.user) { setAdminRole(null); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      if (!alive) return
      setAdminRole(data?.role ?? 'customer')
      if (data?.role === 'admin') {
        const { data: orders } = await supabase.from('orders').select('order_number,customer_name,subtotal,shipping_fee,discount_amount,coupon_code,total,status,payment_method,payment_status,created_at').order('created_at', { ascending: false }).limit(100)
        if (alive) setAdminOrders(orders ?? [])
        const { data: products } = await supabase.from('products').select('id,name,category,price,is_active,sizes,images').order('category').order('name')
        if (alive) { setAdminProducts(products ?? []); setAdminPriceDrafts(Object.fromEntries((products ?? []).map((p) => [p.id, p.price == null ? '' : String(p.price)]))) }
        const { data: stock } = await supabase.from('inventory').select('product_id,size,quantity')
        if (alive) setAdminStockDrafts(Object.fromEntries((stock ?? []).map((row) => [`${row.product_id}::${row.size}`, String(row.quantity)])))
        const { data: customers } = await supabase.from('profiles').select('email,full_name,created_at').order('created_at', { ascending: false }).limit(50)
        if (alive) setAdminCustomers(customers ?? [])
        const [{ data: coupons }, { data: reviews }, { data: shipping }] = await Promise.all([
          supabase.from('coupons').select('id,code,discount_type,discount_value,min_subtotal,max_discount,usage_limit,per_user_limit,used_count,is_active,expires_at').order('created_at',{ascending:false}),
          supabase.from('product_reviews').select('id,product_id,rating,title,body,status,created_at').order('created_at',{ascending:false}).limit(100),
          supabase.from('store_settings').select('value').eq('key','shipping_fee').maybeSingle(),
        ])
        if (alive) {
          setAdminCoupons(coupons ?? [])
          setAdminReviews(reviews ?? [])
          setAdminShippingDraft(shipping?.value == null ? '' : String(shipping.value))
        }
      }
    }
    void loadAdmin()
    return () => { alive = false }
  }, [page])

  const adminSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminNotice('CHECKING ACCESS…')
    const { data, error } = await supabase.auth.signInWithPassword({ email: adminEmail.trim(), password: adminPassword })
    if (error || !data.user) { setAdminNotice(error?.message ?? 'Unable to sign in.'); return }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setAdminUser(null)
      setAdminRole(null)
      setAdminNotice('THIS ACCOUNT DOES NOT HAVE STREET ADMIN ACCESS.')
      return
    }
    setAdminUser(data.user.email ?? null)
    setAdminRole('admin')
    setAdminNotice('ACCESS GRANTED.')
    const { data: orders } = await supabase.from('orders').select('order_number,customer_name,subtotal,shipping_fee,discount_amount,coupon_code,total,status,payment_method,payment_status,created_at').order('created_at', { ascending: false }).limit(100)
    setAdminOrders(orders ?? [])
    const [{ data: products }, { data: stock }, { data: customers }] = await Promise.all([
      supabase.from('products').select('id,name,category,price,is_active,sizes,images').order('category').order('name'),
      supabase.from('inventory').select('product_id,size,quantity'),
      supabase.from('profiles').select('email,full_name,created_at').order('created_at', { ascending: false }).limit(50),
    ])
    setAdminProducts(products ?? [])
    setAdminPriceDrafts(Object.fromEntries((products ?? []).map((p) => [p.id, p.price == null ? '' : String(p.price)])))
    setAdminStockDrafts(Object.fromEntries((stock ?? []).map((row) => [`${row.product_id}::${row.size}`, String(row.quantity)])))
    setAdminCustomers(customers ?? [])
    const [{ data: coupons }, { data: reviews }, { data: shipping }] = await Promise.all([
      supabase.from('coupons').select('id,code,discount_type,discount_value,min_subtotal,max_discount,usage_limit,per_user_limit,used_count,is_active,expires_at').order('created_at',{ascending:false}),
      supabase.from('product_reviews').select('id,product_id,rating,title,body,status,created_at').order('created_at',{ascending:false}).limit(100),
      supabase.from('store_settings').select('value').eq('key','shipping_fee').maybeSingle(),
    ])
    setAdminCoupons(coupons ?? [])
    setAdminReviews(reviews ?? [])
    setAdminShippingDraft(shipping?.value == null ? '' : String(shipping.value))
  }

  const showQuickView = (product: Product) => {
    setQuickView(product)
    setQuickViewSize(product.sizes[0] ?? '')
  }

  const add = (p: Product, size: string, q = 1) => {
    const alreadyInBag = cart.find((item) => item.product.id === p.id && item.size === size)?.qty ?? 0
    if (p.soldOut || (p.stockBySize && (p.stockBySize[size] ?? 0) < alreadyInBag + q)) return
    setCart((c) => {
      const i = c.findIndex((x) => x.product.id === p.id && x.size === size)
      if (i > -1) return c.map((x, k) => (k === i ? { ...x, qty: x.qty + q } : x))
      return [...c, { product: p, size, qty: q }]
    })
    setCartOpen(true)
  }
  const toggleWish = async (id: string) => {
    const removing = wish.includes(id)
    setWish((items) => removing ? items.filter((item) => item !== id) : [...items, id])
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (removing) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', id)
    } else {
      await supabase.from('wishlist_items').upsert({ user_id: user.id, product_id: id })
    }
  }


  const trackOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTrackNotice('SEARCHING YOUR ORDER…')
    setTrackResult(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setTrackNotice('SIGN IN TO YOUR STREET ACCOUNT TO VIEW PRIVATE ORDER DETAILS.'); return }
    const { data, error } = await supabase.from('orders').select('order_number,status,created_at,total').eq('order_number', trackCode.trim()).eq('user_id', user.id).maybeSingle()
    if (error) { setTrackNotice('WE COULD NOT CHECK THIS ORDER RIGHT NOW.'); return }
    if (!data) { setTrackNotice('NO ORDER FOUND FOR THIS ACCOUNT. CHECK THE NUMBER AND TRY AGAIN.'); return }
    setTrackResult(data)
    setTrackNotice('')
  }

  const saveAdminPrice = async (id: string) => {
    const raw = adminPriceDrafts[id]?.trim() ?? ''
    const product = adminProducts.find((item) => item.id === id)
    if (!product) return
    const price = Number(raw)
    const range = PRICE_RANGES[product.category as Category]
    if (!raw || !Number.isFinite(price) || price < range.min || price > range.max) {
      setAdminNotice(`PRICE MUST BE BETWEEN EGP ${range.min.toLocaleString('en-EG')} AND EGP ${range.max.toLocaleString('en-EG')} FOR ${product.category}.`)
      return
    }
    const { error } = await supabase.from('products').update({ price, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setAdminNotice(error.message); return }
    setAdminProducts((items) => items.map((item) => item.id === id ? { ...item, price } : item))
    setCatalogProducts((items) => items.map((item) => item.id === id ? { ...item, price } : item))
    setCart((items) => items.map((item) => item.product.id === id ? { ...item, product: { ...item.product, price } } : item))
    setActive((item) => item.id === id ? { ...item, price } : item)
    setAdminNotice('PRODUCT PRICE UPDATED.')
  }

  const createAdminProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newProductName.trim().toUpperCase()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const id = `${newProductCategory.toLowerCase()}-${slug}-${Date.now().toString(36)}`
    const rawPrice = newProductPrice.trim()
    const range = PRICE_RANGES[newProductCategory]
    const price = rawPrice === '' ? range.default : Number(rawPrice)
    if (!Number.isFinite(price) || price < range.min || price > range.max) {
      setAdminNotice(`PRICE MUST BE BETWEEN EGP ${range.min.toLocaleString('en-EG')} AND EGP ${range.max.toLocaleString('en-EG')} FOR ${newProductCategory}.`)
      return
    }
    const sizes = newProductCategory === 'PANTS' ? ['30','32','34','36','38','40','42'] : ['S','M','L','XL']
    const { data, error } = await supabase.from('products').insert({
      id, name, category: newProductCategory, description: 'STREET product.',
      price, sizes, images: [], color: '#292929', is_active: true,
    }).select('id,name,category,price,is_active,sizes,images').single()
    if (error || !data) { setAdminNotice(error?.message ?? 'PRODUCT COULD NOT BE CREATED.'); return }
    const product: Product = { id: data.id, name: data.name, category: data.category as Category, price: data.price == null ? 0 : Number(data.price), sizes: data.sizes, images: data.images ?? [], color: '#292929', stockBySize: Object.fromEntries(data.sizes.map((size: string) => [size, 0])), soldOut: true, details: ['Product information will be updated.'] }
    setAdminProducts((items) => [...items, data])
    setAdminPriceDrafts((items) => ({ ...items, [id]: rawPrice }))
    setAdminStockDrafts((items) => items)
    setCatalogProducts((items) => [product, ...items])
    setNewProductName('')
    setNewProductPrice('')
    setAdminNotice('NEW PRODUCT CREATED. ADD ITS PHOTOS AND STOCK BELOW.')
  }

  const uploadAdminImage = async (id: string) => {
    const file = adminImageFiles[id]
    if (!file) { setAdminNotice('CHOOSE AN IMAGE FIRST.'); return }
    if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)) { setAdminNotice('USE JPG, PNG, WEBP OR AVIF.'); return }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${id}/${Date.now()}-${safeName}`
    setAdminNotice('UPLOADING PRODUCT IMAGE…')
    const { error: uploadError } = await supabase.storage.from('street-product-images').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) { setAdminNotice(uploadError.message); return }
    const { data: publicData } = supabase.storage.from('street-product-images').getPublicUrl(path)
    const current = adminProducts.find((product) => product.id === id)
    const images = [...(current?.images ?? PRODUCTS.find((product) => product.id === id)?.images ?? []), publicData.publicUrl]
    const { error } = await supabase.from('products').update({ images, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setAdminNotice(error.message); return }
    setAdminProducts((items) => items.map((item) => item.id === id ? { ...item, images } : item))
    setCatalogProducts((items) => items.map((item) => item.id === id ? { ...item, images } : item))
    setAdminImageFiles((items) => ({ ...items, [id]: null }))
    setAdminNotice('PRODUCT IMAGE ADDED.')
  }

  const saveAdminStock = async (productId: string, size: string) => {
    const key = `${productId}::${size}`
    const rawQuantity = adminStockDrafts[key]?.trim() ?? ''
    const quantity = Number(rawQuantity)
    if (rawQuantity === '' || !Number.isInteger(quantity) || quantity < 0) { setAdminNotice('ENTER A WHOLE NUMBER FOR STOCK.'); return }
    const { error } = await supabase.from('inventory').upsert({ product_id: productId, size, quantity, updated_at: new Date().toISOString() }, { onConflict: 'product_id,size' })
    if (error) { setAdminNotice(error.message); return }
    setCatalogProducts((items) => items.map((product) => {
      if (product.id !== productId) return product
      const stockBySize = Object.fromEntries(product.sizes.map((item) => [item, product.stockBySize?.[item] ?? 0]))
      stockBySize[size] = quantity
      return { ...product, stockBySize, soldOut: product.sizes.every((item) => stockBySize[item] <= 0) }
    }))
    setActive((product) => {
      if (product.id !== productId) return product
      const stockBySize = Object.fromEntries(product.sizes.map((item) => [item, product.stockBySize?.[item] ?? 0]))
      stockBySize[size] = quantity
      return { ...product, stockBySize, soldOut: product.sizes.every((item) => stockBySize[item] <= 0) }
    })
    setAdminNotice('STOCK UPDATED.')
  }

  const toggleAdminProduct = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !is_active, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setAdminNotice(error.message); return }
    setAdminProducts((items) => items.map((item) => item.id === id ? { ...item, is_active: !is_active } : item))
    if (is_active) {
      setCatalogProducts((items) => items.filter((item) => item.id !== id))
      if (active.id === id) { setPage('store'); window.history.replaceState({}, '', '/shop') }
    } else {
      const base = PRODUCTS.find((item) => item.id === id)
      const current = adminProducts.find((item) => item.id === id)
      if (base) setCatalogProducts((items) => [...items.filter((item) => item.id !== id), { ...base, price: current?.price ?? 0 }])
    }
  }

  const exportAdminOrders = () => {
    if (!adminOrders.length) { setAdminExportNotice('NO ORDER DATA TO EXPORT.'); return }
    const columns = ['order_number', 'customer_name', 'subtotal_egp', 'shipping_egp', 'discount_egp', 'coupon_code', 'total_egp', 'payment_method', 'payment_status', 'order_status', 'created_at']
    const rows = adminOrders.map((order) => [
      order.order_number,
      order.customer_name,
      Number(order.subtotal).toFixed(2),
      Number(order.shipping_fee).toFixed(2),
      Number(order.discount_amount).toFixed(2),
      order.coupon_code ?? '',
      Number(order.total).toFixed(2),
      order.payment_method ?? '',
      order.payment_status,
      order.status,
      order.created_at,
    ])
    const csv = [columns, ...rows].map((row) => row.map((value) => {
      const safe = String(value ?? '').replace(/"/g, '""')
      return /[",\n]/.test(safe) ? `"${safe}"` : safe
    }).join(',')).join('\r\n')
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `street-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setAdminExportNotice('ORDERS CSV EXPORTED.')
  }

  const applyCheckoutCoupon = async () => {
    if (!checkoutCoupon.trim()) { setCheckoutCouponCode(''); setCheckoutDiscount(0); setCheckoutNotice('COUPON REMOVED.'); return }
    const { data, error } = await supabase.rpc('validate_street_coupon', { p_code: checkoutCoupon.trim(), p_subtotal: subtotal })
    if (error || !data?.valid) { setCheckoutCouponCode(''); setCheckoutDiscount(0); setCheckoutNotice(data?.message ?? error?.message ?? 'COUPON COULD NOT BE VALIDATED.'); return }
    setCheckoutCouponCode(data.code)
    setCheckoutDiscount(Number(data.discount) || 0)
    setCheckoutNotice(data.message ?? 'COUPON APPLIED.')
  }

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checkoutBusy || !cart.length) return
    setCheckoutBusy(true)
    setCheckoutNotice('VALIDATING YOUR ORDER…')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.rpc('create_street_order', {
      p_customer: { email: checkoutEmail.trim(), full_name: checkoutName, phone: checkoutPhone, address: checkoutAddress, city: checkoutCity, notes: checkoutNotes },
      p_items: cart.map((item) => ({ product_id: item.product.id, size: item.size, quantity: item.qty })),
      p_coupon_code: checkoutCouponCode || null,
    })
    setCheckoutBusy(false)
    if (error || !data?.order_number) { setCheckoutNotice(error?.message ?? 'ORDER COULD NOT BE CREATED.'); return }
    setOrderSuccess({ order_number: data.order_number, total: Number(data.total), guest: !user })
    setCatalogProducts((products) => products.map((product) => {
      const stockBySize = { ...(product.stockBySize ?? {}) }
      cart.filter((item) => item.product.id === product.id).forEach((item) => {
        stockBySize[item.size] = Math.max(0, (stockBySize[item.size] ?? 0) - item.qty)
      })
      const soldOut = product.sizes.every((size) => (stockBySize[size] ?? 0) <= 0)
      return { ...product, stockBySize, soldOut }
    }))
    setCart([])
    setCheckoutCoupon('')
    setCheckoutCouponCode('')
    setCheckoutDiscount(0)
    setCheckoutNotice('ORDER PLACED. PAYMENT IS CASH ON DELIVERY.')
  }

  const createAdminCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = newCouponCode.trim().toUpperCase()
    const value = Number(newCouponValue)
    const min = Number(newCouponMin || 0)
    const limit = newCouponLimit.trim() ? Number(newCouponLimit) : null
    if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !Number.isFinite(value) || value <= 0 || (newCouponType === 'percent' && value > 100) || !Number.isFinite(min) || min < 0 || (limit !== null && (!Number.isInteger(limit) || limit < 1))) {
      setAdminNotice('CHECK COUPON CODE, VALUE, MINIMUM AND USAGE LIMIT.')
      return
    }
    const { data, error } = await supabase.from('coupons').insert({
      code, discount_type: newCouponType, discount_value: value, min_subtotal: min,
      usage_limit: limit, per_user_limit: 1, expires_at: newCouponExpiry ? new Date(newCouponExpiry).toISOString() : null,
    }).select('id,code,discount_type,discount_value,min_subtotal,max_discount,usage_limit,per_user_limit,used_count,is_active,expires_at').single()
    if (error || !data) { setAdminNotice(error?.message ?? 'COUPON COULD NOT BE CREATED.'); return }
    setAdminCoupons((items) => [data, ...items])
    setNewCouponCode('')
    setAdminNotice('COUPON CREATED.')
  }

  const toggleAdminCoupon = async (id: string, active: boolean) => {
    const { error } = await supabase.from('coupons').update({ is_active: !active }).eq('id',id)
    if (error) { setAdminNotice(error.message); return }
    setAdminCoupons((items) => items.map((item) => item.id === id ? { ...item, is_active: !active } : item))
  }

  const moderateReview = async (id: string, status: 'approved'|'rejected') => {
    const { error } = await supabase.from('product_reviews').update({ status, updated_at: new Date().toISOString() }).eq('id',id)
    if (error) { setAdminNotice(error.message); return }
    setAdminReviews((items) => items.map((item) => item.id === id ? { ...item, status } : item))
  }

  const saveAdminShipping = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fee = Number(adminShippingDraft)
    if (adminShippingDraft.trim() === '' || !Number.isFinite(fee) || fee < 0) { setAdminNotice('ENTER A VALID DELIVERY FEE.'); return }
    const { error } = await supabase.from('store_settings').upsert({ key: 'shipping_fee', value: fee, updated_at: new Date().toISOString() })
    if (error) { setAdminNotice(error.message); return }
    setAdminNotice('DELIVERY FEE SAVED.')
  }

  const updateAdminOrder = async (order_number: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('order_number', order_number)
    if (error) { setAdminNotice(error.message); return }
    setAdminOrders((items) => items.map((item) => item.order_number === order_number ? { ...item, status } : item))
  }

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const subtotal = cart.reduce((n, i) => n + i.product.price * i.qty, 0)
  const checkoutTotal = Math.max(0, subtotal - checkoutDiscount) + (checkoutShipping ?? 0)
  useEffect(() => {
    if (!checkoutCouponCode) return
    setCheckoutCouponCode('')
    setCheckoutDiscount(0)
    setCheckoutNotice('YOUR BAG CHANGED. APPLY THE COUPON AGAIN.')
  }, [subtotal])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? catalogProducts.filter((p) => (p.name + p.category).toLowerCase().includes(q)) : catalogProducts.slice(0, 4)
  }, [query, catalogProducts])

  const dateStr = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const scrollRow = useRef<Record<string, HTMLDivElement | null>>({})
  const [progress, setProgress] = useState<Record<string, number>>({})
  const onRow = (k: string) => {
    const el = scrollRow.current[k]
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress((p) => ({ ...p, [k]: max > 0 ? el.scrollLeft / max : 0 }))
  }

  const card = (p: Product, index?: number, total?: number, row?: boolean, rotateImages = false) => (
    <article className={`card ${p.soldOut ? 'sold' : ''}`}>
      <button className={`heart ${wish.includes(p.id) ? 'on' : ''}`} onClick={() => toggleWish(p.id)} aria-label="Wishlist">
        {Icon.heart}
      </button>
      <div className="card-img" onClick={() => openProduct(p)}>
        {rotateImages ? <RotatingProductImage images={p.images} /> : <Img src={p.images[0]} />}
      </div>
      <button className="card-quick-view" type="button" onClick={() => showQuickView(p)}>QUICK VIEW <span>↗</span></button>
      <div className="dots"><i className="on" /><i /></div>
      {index !== undefined && <div className="idx">{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>}
      {p.soldOut && <div className="soldtxt">SOLD OUT</div>}
      <h3 onClick={() => openProduct(p)}>{p.name}</h3>
      <div className="price">{money(p.price)}</div>
      {row !== false && (
        <div className="chips">
          {p.sizes.map((s, i) => (
            <span key={s} className={i === 0 ? 'on' : ''}>{s}</span>
          ))}
        </div>
      )}
      <button className="mini-bag" disabled={p.soldOut} onClick={() => add(p, p.sizes[0])} aria-label="Add to bag">
        {Icon.bag}
      </button>
    </article>
  )

  const rowOf = (id: string, title: string, items: Product[]) => (
    <section className="row">
      <h2 className="row-title">{title}</h2>
      <button className="view-all" onClick={() => openCollection(items[0]?.category ?? 'HOODIES')}>VIEW ALL</button>
      <div className="row-scroll" ref={(el) => { scrollRow.current[id] = el }} onScroll={() => onRow(id)}>
        {items.map((p) => <Fragment key={p.id}>{card(p)}</Fragment>)}
      </div>
      <div className="progress"><b style={{ width: `${30 + (progress[id] ?? 0) * 70}%` }} /></div>
    </section>
  )

  const header = () => (
    <>
      <div className="ann">
        <button onClick={() => setAnn((a) => (a - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}>‹</button>
        <span key={ann}>{ANNOUNCEMENTS[ann]}</span>
        <button onClick={() => setAnn((a) => (a + 1) % ANNOUNCEMENTS.length)}>›</button>
      </div>
      <header className="hdr">
        <button className="mobile-menu-toggle" onClick={() => setMenu(true)} aria-label="Open navigation">☰</button>
      <div className="hdr-logo" onClick={() => go('hero')} aria-label="STREET home">
          <Logo3D pose={{ rx: 0.08, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0.95} fov={30} />
        </div>
        <nav>
          {NAV.map((n) => (
            <a
              key={n.label}
              className={n.page === page ? 'cur' : ''}
              onClick={() => go(n.page)}
            >
              {n.label}{n.label === 'SHOP' && <em> ⌄</em>}
            </a>
          ))}
        </nav>
        <div className="icons">
          <button onClick={() => setSearch(true)}>{Icon.search}</button>
          <button onClick={() => go('wishlist')}>{Icon.heart}<span>({wish.length})</span></button>
          <button onClick={() => setDark((d) => !d)}>{Icon.moon}</button>
          <button onClick={() => setCartOpen(true)}>{Icon.bag}<span>({cartCount})</span></button>
        </div>
      </header>
    </>
  )

  const footer = () => (
    <footer id="footer">
      <div className="benefits">
        {[
          ['PRODUCT DETAILS', 'Verified information on each item'],
          ['SIZING', 'Check measurements before ordering'],
          ['ORDER STATUS', 'Track your order from your account'],
          ['SUPPORT', 'Official contact details coming soon'],
        ].map(([a, b]) => (
          <div key={a}><i />{<div><b>{a}</b><small>{b}</small></div>}</div>
        ))}
      </div>
      <div className="footer-link-groups footer-explore-only">
        <nav className="street-utility-nav" aria-label="STREET pages">
          <span>EXPLORE STREET</span>
          <button onClick={() => go('new-arrivals')}>NEW ARRIVALS ↗</button>
          <button onClick={() => go('best-sellers')}>BEST SELLERS ↗</button>
          <button onClick={() => go('lookbook')}>LOOKBOOK ↗</button>
          <button onClick={() => go('build-outfit')}>BUILD YOUR OUTFIT ↗</button>
          <button onClick={() => go('size-guide')}>SIZE GUIDE ↗</button>
          <button onClick={() => go('track')}>ORDER TRACKING ↗</button>
          <button onClick={() => go('checkout')}>YOUR BAG ↗</button>
          <button onClick={() => go('account')}>ACCOUNT ↗</button>
          <button onClick={() => go('help')}>HELP & FAQ ↗</button>
        </nav>
      </div>
      <div className="foot-mid">
        <span>Inspired By {BRAND}</span>
        <div><span className="secure">Order and payment details will be confirmed at checkout.</span><Pay /></div>
      </div>
      <div className="footer-mark"><Logo className="footer-logo" /></div>
      <div className="footer-legal-bottom">
        <nav className="street-legal-nav" aria-label="Legal information and settings">
          <span>LEGAL & INFORMATION</span>
          <button onClick={() => go('purchase-terms')}>TERMS AND CONDITIONS OF PURCHASE ↗</button>
          <button onClick={() => go('style-terms')}>TERMS FOR #STREETSTYLE ↗</button>
          <button onClick={() => go('privacy')}>PRIVACY POLICY ↗</button>
          <button onClick={() => go('cookies')}>COOKIES POLICY ↗</button>
          <button onClick={() => go('cookie-settings')}>COOKIE SETTINGS ↗</button>
          <button onClick={() => go('sitemap')}>SITEMAP ↗</button>
          <button onClick={() => go('ai-terms')}>USE OF AI ↗</button>
          <button onClick={() => go('market-language')}>EGYPT | ENGLISH ↗</button>
        </nav>
        <small>© {new Date().getFullYear()} STREET. ALL RIGHTS RESERVED.</small>
      </div>
    </footer>
  )

  const categorySizes = Array.from(new Set(catalogProducts.filter((p) => p.category === category).flatMap((p) => p.sizes)))
  const filtered = catalogProducts.filter((p) => p.category === category && (!inStock || !p.soldOut) && (!sizeFilter || p.sizes.includes(sizeFilter)) && (minPrice === '' || p.price >= Number(minPrice)) && (maxPrice === '' || p.price <= Number(maxPrice))).sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'name' ? a.name.localeCompare(b.name) : 0)
  const recentlyViewed = recentIds.map((id) => catalogProducts.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
  const orderedShopProducts = [...catalogProducts].sort((a,b) => {
    const order = ['PANTS','JACKETS','HOODIES','T-SHIRTS','CAPS']
    return order.indexOf(a.category) - order.indexOf(b.category)
  })
  const visibleShopProducts = showAllShopProducts ? orderedShopProducts : orderedShopProducts.slice(0, 12)

  const outfitOrder: Category[] = active.category === 'PANTS'
    ? ['JACKETS', 'T-SHIRTS']
    : active.category === 'JACKETS'
      ? ['T-SHIRTS', 'PANTS']
      : active.category === 'T-SHIRTS'
        ? ['JACKETS', 'PANTS']
        : active.category === 'CAPS'
          ? ['PANTS', 'JACKETS', 'HOODIES', 'T-SHIRTS', 'CAPS']
          : ['PANTS', 'JACKETS', 'T-SHIRTS', 'CAPS']
  const outfitProducts = outfitOrder
    .flatMap((c) => catalogProducts.filter((p) => p.category === c && p.id !== active.id))


  return (
    <div className={`app page-${page}`}>
      <a className="skip-link" href="#main-content">SKIP TO CONTENT</a>
      <div className="cursor" ref={cursor} />

      {page === 'intro' && (
        <div className="intro">
          <div className="intro-shade" />
          <div className="intro-hud"><span>STREET / SYSTEM 001</span><span>INITIALIZING EXPERIENCE</span></div>
          <Logo className="intro-logo" />
          <span className="intro-loading">LOADING EXPERIENCE <i /></span>
        </div>
      )}

      {page === 'hero' && (
        <section className="hero">
          {(() => {
            const sceneAsset = ASSETS.scenes[scene] || ASSETS.introVideo
            return /\.(mp4|webm)$/i.test(sceneAsset) ? (
              <video className="hero-bg" src={sceneAsset} autoPlay loop muted playsInline preload="auto" />
            ) : (
              <Img className="hero-bg" src={sceneAsset} />
            )
          })()}
          <button className={`burger ${menu ? 'hide' : ''}`} onClick={() => setMenu(true)} aria-label="Menu"><i /><i /><i /></button>
          <div className="scene-dots">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className={scene === i ? 'on' : ''} onClick={() => setScene(i)} aria-label={`Scene ${i + 1}`} />
            ))}
          </div>
          <div className="hero-top">
            <Logo className="hero-logo" />
            <small>{dateStr} · {timeStr}</small>
          </div>
          <div className="hero-center-logo" aria-label="STREET logo">
            <Logo3D pose={{ rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0.85} fov={30} />
          </div>
          <button className="enter" onClick={() => go('store')}>ENTER STORE</button>
        </section>
      )}

      {page !== 'intro' && page !== 'hero' && header()}

      {page === 'store' && (
        <main id="main-content" className="store shop-page">
          <section className="shop-masthead">
            <div className="shop-masthead-copy">
              <div className="page-kicker">STREET / PRODUCT DATABASE / 001</div>
              <small>THE CURRENT ROTATION</small>
              <h1>SHOP<br /><span>ALL PIECES.</span></h1>
              <p>Explore the complete STREET catalogue. Filter by category, find your fit, and build your rotation.</p>
            </div>
            <div className="shop-masthead-visual">
              <video src={ASSETS.storeHero} autoPlay muted loop playsInline />
              <span>LIVE CATALOGUE / {catalogProducts.length} ITEMS</span>
            </div>
            <div className="shop-stats"><span>{CATEGORIES.length} / CATEGORIES</span><span>{catalogProducts.length} / PRODUCTS</span><span>SCROLL TO EXPLORE ↓</span></div>
          </section>
              <section className="shop-categories">
            <div className="section-head"><small>01 / FIND YOUR CATEGORY</small><span>SELECT A DEPARTMENT ↗</span></div>
            <div className="shop-category-list">
              {CATEGORIES.map((c,i) => (
                <button className="shop-category-card" key={c} onClick={() => openCollection(c as Category)}>
                  <sup>DEPARTMENT / {String(i+1).padStart(2,'0')}</sup>
                  <strong>{categoryLabel(c as Category)}</strong>
                  <span>EXPLORE <b>↗</b></span>
                </button>
              ))}
            </div>
          </section>
          <section className="shop-all">
            <div className="section-head"><small>02 / THE FULL ROTATION</small><span>{catalogProducts.length} PRODUCTS / SORTED BY DEPARTMENT</span></div>
            <div className="shop-grid">
              {visibleShopProducts.map((p,i) => <Fragment key={p.id}>{card(p,i+1,catalogProducts.length)}</Fragment>)}
            </div>
            <button className="shop-expand" onClick={() => setShowAllShopProducts((v) => !v)}>{showAllShopProducts ? 'SHOW LESS ↑' : `VIEW ALL ${catalogProducts.length} PRODUCTS ↓`}</button>
          </section>
          {recentlyViewed.length > 0 && rowOf('recent', 'RECENTLY VIEWED', recentlyViewed)}
          {footer()}
        </main>
      )}

      {page === 'collections' && (
        <main id="main-content" className="collections-page">
          <div className="page-kicker">STREET / CURATED EDITS / 002</div>
          <section className="collections-intro">
            <small>NOT A PRODUCT LIST. A POINT OF VIEW.</small>
            <h1>THE<br /><span>COLLECTIONS.</span></h1>
            <p>Shop is the complete catalogue. Collections are curated edits — grouped by mood, purpose and the way pieces work together.</p>
          </section>
          <section className="edit-grid">
            {([
              { cat: 'HOODIES', name: 'THE HOODIE COLLECTION', desc: 'Heavyweight hoodies and zip-ups for everyday wear.' },
              { cat: 'PANTS', name: 'THE PANTS COLLECTION', desc: 'Relaxed fits, denim and everyday utility trousers.' },
              { cat: 'JACKETS', name: 'THE JACKET COLLECTION', desc: 'Outerwear built for layering and everyday rotation.' },
              { cat: 'T-SHIRTS', name: 'THE T-SHIRT COLLECTION', desc: 'Essential tees, clean graphics and daily staples.' },
              { cat: 'CAPS', name: 'THE CAPS COLLECTION', desc: 'Finishing pieces made to complete the STREET look.' },
            ] as const).map((edit, index) => (
              <button className="edit-card" key={edit.cat} onClick={() => openCollection(edit.cat)}>
                <div className="edit-card-art">
                  <Img
                    src={catalogProducts.find((product) => product.category === edit.cat)?.images[0]}
                    className="edit-card-cover"
                  />
                  <div className="edit-card-products">
                    {catalogProducts.filter((product) => product.category === edit.cat).slice(1, 3).map((product) => (
                      <Img key={product.id} src={product.images[0]} className="edit-card-product-image" />
                    ))}
                  </div>
                  <span>STREET / COLLECTION {String(index + 1).padStart(2, '0')}</span>
                  <b>{edit.name}</b>
                  <i>↗</i>
                </div>
                <div className="edit-card-copy">
                  <div><small>{edit.cat} / {catalogProducts.filter((product) => product.category === edit.cat).length} PIECES</small><h2>{edit.name}</h2><p>{edit.desc}</p></div>
                  <span>EXPLORE EDIT ↗</span>
                </div>
              </button>
            ))}
          </section>
          {footer()}
        </main>
      )}

      {page === 'collection' && (
        <main id="main-content" className="collection">
          <h1>{categoryLabel(category)}</h1>
          <small>{filtered.length} PRODUCTS</small>
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button key={c} className={c === category ? 'on' : ''} onClick={() => { setCategory(c); setSizeFilter(null); window.history.pushState({}, '', `/collections/${encodeURIComponent(String(c).toLowerCase())}`) }}>{categoryLabel(c as Category)}</button>
            ))}
          </div>
          <div className="toolbar">
            <div className="sz"><span>SIZE</span>{categorySizes.map((s) => (
              <button key={s} className={sizeFilter === s ? 'on' : ''} onClick={() => setSizeFilter(sizeFilter === s ? null : s)}>{s}</button>
            ))}</div>
            <div className="tools">
              <label className="sort-label">SORT BY <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>
              <label>IN STOCK <i className={`tog ${inStock ? 'on' : ''}`} onClick={() => setInStock(!inStock)}><b /></i></label>
              <label className="price-filter">MIN EGP <input aria-label="Minimum price" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" /></label>
              <label className="price-filter">MAX EGP <input aria-label="Maximum price" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="—" /></label>
              {(minPrice || maxPrice || sizeFilter || inStock) && <button className="clear-filters" type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); setSizeFilter(null); setInStock(false) }}>CLEAR FILTERS ×</button>}
            </div>
          </div>
          <div className="grid">
            {filtered.map((p, i) => <Fragment key={p.id}>{card(p, i + 1, filtered.length)}</Fragment>)}
          </div>
          {filtered.length === 0 && <div className="catalog-empty"><h2>NO PRODUCTS IN THIS COLLECTION YET.</h2><p>Product listings will appear here once the real product photos, prices and sizes are added.</p></div>}
          {footer()}
        </main>
      )}

      {page === 'product' && (
        <main id="main-content" className="pdp">
          <div className="pdp-wrap">
            <div className={`gallery ${galleryPaused ? 'is-paused' : ''}`} aria-label="Continuously moving horizontal product gallery">
              <div className="product-gallery-track">
                {[...active.images, ...active.images].map((im, i) => (
                  <div className="product-gallery-item" key={`${active.id}-gallery-${i}`}>
                    <Img src={im} className="g-img" />
                  </div>
                ))}
              </div>
              <div className="gallery-controls">
                <button className="gallery-toggle" type="button" onClick={() => setGalleryPaused((paused) => !paused)} aria-label={galleryPaused ? 'Play product gallery' : 'Pause product gallery'}>
                  {galleryPaused ? 'PLAY' : 'PAUSE'}
                  <span>{galleryPaused ? '▶' : 'Ⅱ'}</span>
                </button>
              </div>
            </div>
            <aside className="info">
              <div className="product-panel-top"><small>STREET / {category}</small><button className={`heart-sq ${wish.includes(active.id) ? 'on' : ''}`} onClick={() => toggleWish(active.id)} aria-label="Save to wishlist">♡</button></div>
              <div className="product-title-line"><h1>{active.name}</h1><div className="p-price" aria-live="polite">{catalogReady ? money(active.price) : 'LOADING…'}</div></div>
              <div className="product-color-row"><div className="swatch" style={{ background: active.color }} /><span>SELECTED COLOUR</span></div>
              <div className="product-size-head"><label>SIZE</label><button type="button" onClick={() => setSizeGuideOpen((open) => !open)}>SIZE GUIDE</button></div>
              <div className="sizes">
                {active.sizes.map((s) => <button key={s} disabled={Boolean(active.stockBySize && (active.stockBySize[s] ?? 0) <= 0)} className={sizeSel === s ? 'on' : ''} onClick={() => setSizeSel(s)}>{s}</button>)}
              </div>
              {sizeGuideOpen && <div className="size-guide"><b>SIZE GUIDE</b><p>Compare these with a similar item you own. Verified garment measurements will be added when available.</p><div className="size-guide-table"><span>SIZE</span><span>CHEST</span><span>LENGTH</span>{active.sizes.map((size) => <Fragment key={size}><span>{size}</span><span>—</span><span>—</span></Fragment>)}</div></div>}
              <div className="product-quantity"><label>QUANTITY</label><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button disabled={Boolean(active.stockBySize && qty >= (active.stockBySize[sizeSel] ?? 0))} onClick={() => setQty(qty + 1)}>+</button></div></div>
              <button className="product-add" disabled={active.soldOut || Boolean(active.stockBySize && (active.stockBySize[sizeSel] ?? 0) < qty)} onClick={() => add(active, sizeSel, qty)}>{active.soldOut ? 'SOLD OUT' : 'ADD TO BAG'} <span>{catalogReady ? money(active.price) : 'LOADING…'}</span></button>
              <div className="product-specific-details">
                <small>ABOUT THIS PIECE</small>
                <p>{active.details.length ? active.details.join(' ') : 'A considered STREET essential, selected for everyday styling.'}</p>
              </div>
              <div className="product-info-links">
                <section className={openMaterials ? 'is-open' : ''}>
                  <button type="button" onClick={() => setOpenMaterials((open) => !open)} aria-expanded={openMaterials}>
                    <span className="product-accordion-label">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5C12 3.5 5 6.5 5 13.2c0 3.2 2.2 5.3 5.1 5.3 6.7 0 9.7-7 10.4-15Z"/><path d="M3.5 21c3.2-5.2 7.2-8.7 12.1-11.3"/></svg>
                      MATERIALS, CARE AND SOURCE
                    </span><span className="product-accordion-symbol">{openMaterials ? '−' : '+'}</span>
                  </button>
                  {openMaterials && <div className="product-accordion-content">
                    <p><b>Materials</b><br/>The exact fabric composition has not been confirmed for this piece yet. Please check the garment label for verified fibre details.</p>
                    <p><b>Care</b><br/>Follow the care label. To help preserve the colour and print, wash inside out with similar colours and avoid high heat.</p>
                    <p><b>Source</b><br/>Designed and selected for the STREET collection. Country of manufacture is not currently listed.</p>
                  </div>}
                </section>
                <section className={openDelivery ? 'is-open' : ''}>
                  <button type="button" onClick={() => setOpenDelivery((open) => !open)} aria-expanded={openDelivery}>
                    <span className="product-accordion-label">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>
                      DELIVERIES AND RETURNS
                    </span><span className="product-accordion-symbol">{openDelivery ? '−' : '+'}</span>
                  </button>
                  {openDelivery && <div className="product-accordion-content">
                    <p><b>Delivery</b><br/>The delivery fee is shown at checkout for your order. Payment is currently cash on delivery.</p>
                    <p><b>Returns and exchanges</b><br/>The store's return and exchange terms have not yet been published. Please contact the STREET team to confirm eligibility before ordering.</p>
                  </div>}
                </section>
              </div>
              <div className="prevnext">
                <span onClick={() => { const l = catalogProducts.filter((p) => p.category === active.category); openProduct(l[(l.indexOf(active) - 1 + l.length) % l.length]) }}>‹ PREV</span>
                <span onClick={() => { const l = catalogProducts.filter((p) => p.category === active.category); openProduct(l[(l.indexOf(active) + 1) % l.length]) }}>NEXT ›</span>
              </div>
            </aside>
          </div>
          {outfitProducts.length > 0 && (
            <section className="complete-outfit">
              <div className="complete-outfit-head">
                <div><small>STREET / STYLE THE PIECE</small><h2>COMPLETE YOUR OUTFIT<span>.</span></h2></div>
                <p>MAKE THE LOOK YOURS — EXPLORE PIECES THAT WORK TOGETHER.</p>
              </div>
              <div className="complete-outfit-marquee">
                <div className="complete-outfit-track">
                  {outfitProducts.map((p, i) => (
                    <Fragment key={`${p.id}-outfit`}>{card(p, i + 1, outfitProducts.length, false, true)}</Fragment>
                  ))}
                </div>
              </div>
            </section>
          )}
          {footer()}
        </main>
      )}

      {page === 'studio' && (
        <main id="main-content" className="studio-page">
          <div className="page-kicker">STREET / THE STUDIO / 003</div>
          <section className="studio-hero">
            <div className="studio-title"><small>AN INDEPENDENT STREETWEAR PROJECT</small><h1>BUILT<br />TO MOVE<br /><span>DIFFERENT.</span></h1></div>
            <div className="studio-visual"><div className="studio-orbit orbit-one" /><div className="studio-orbit orbit-two" /><Logo3D className="studio-logo-3d" pose={{rx:.2,ry:.3,rz:0,s:1.15,x:0,y:0}} spin={.15} /><span>STREET / CREATIVE SYSTEM 001</span></div>
          </section>
          <section className="studio-statement"><small>OUR POINT OF VIEW / 001</small><p>STREET is an independent space for considered everyday pieces. A visual language built around movement, utility and personal expression. No fixed uniform. Make the pieces your own.</p></section>
          <section className="studio-grid">
            <div><small>01 / DESIGN</small><h2>FORM<br />FOLLOWS<br />FUNCTION.</h2><p>Clear silhouettes, considered proportions and details that earn their place.</p></div>
            <div><small>02 / MOVEMENT</small><h2>MADE FOR<br />YOUR OWN<br />DIRECTION.</h2><p>Pieces designed to move between places, routines and different versions of you.</p></div>
            <div><small>03 / IDENTITY</small><h2>NO ONE<br />WAY TO<br />WEAR IT.</h2><p>STREET is a starting point. The final expression is always yours.</p></div>
          </section>
          <div className="studio-end"><Logo className="studio-end-logo" /><span>END OF TRANSMISSION / STREET 001</span></div>
          {footer()}
        </main>
      )}

      {page === 'contact' && (
        <main id="main-content" className="contact-page">
          <div className="page-kicker">STREET / GET IN TOUCH</div>
          <section className="contact-layout">
            <div><small>WE'RE HERE TO HELP</small><h1>LET'S<br />TALK.</h1><p>Questions about an order, sizing or just want to say hello? Reach out and our team will get back to you.</p><span className="contact-email">CONTACT CHANNELS COMING SOON</span></div>
            <div className="contact-details">
              <div><small>ORDERS</small><b>Questions about an order</b><span>Use the contact channel provided with your order confirmation.</span></div>
              <div><small>PRODUCTS</small><b>Sizing, fit and product information</b><span>Product-specific details will be listed on each product page.</span></div>
              <div><small>COLLABORATIONS</small><b>Press and creative enquiries</b><span>Official contact details will be added here.</span></div>
            </div>
          </section>
          <div className="contact-bottom"><span>MON — FRI</span><b>09:00 — 18:00 GMT</b><span>WE USUALLY REPLY WITHIN 1–2 BUSINESS DAYS.</span></div>
          {footer()}
        </main>
      )}

      {page === 'help' && (
        <main id="main-content" className="utility-page help-page">
          <div className="page-kicker">STREET / CUSTOMER SUPPORT / 012</div>
          <div className="utility-heading"><small>GOOD TO KNOW BEFORE YOU ORDER</small><h1>HELP<br/><span>& ANSWERS.</span></h1><p>Clear information about how the current STREET store works.</p></div>
          <section className="help-intro"><b>THE CURRENT STORE SETUP</b><p>STREET currently supports cash on delivery. Product availability is based on the live size-level stock shown in the store. Some store services may remain unavailable until the team completes their setup.</p></section>
          <section className="help-faq-list">
            <article><small>01 / ORDERS</small><h2>How do I place an order?</h2><p>Add available pieces to your bag, sign in or create an account, then enter your delivery details at checkout. Your order is checked against current prices and stock before it is created.</p></article>
            <article><small>02 / PAYMENT</small><h2>Which payment methods are available?</h2><p>Cash on delivery is the currently supported payment method. STREET does not collect card details through this checkout.</p></article>
            <article><small>03 / AVAILABILITY</small><h2>Why is my size unavailable?</h2><p>Sizes are enabled only when inventory has been added for that exact product and size. If a size is disabled, it is currently unavailable to order.</p></article>
            <article><small>04 / TRACKING</small><h2>Where can I track my order?</h2><p>Sign in to your STREET account to view your order history and status. Private order details are only available to the account that placed the order.</p><button className="text-button" onClick={() => go('account')}>GO TO MY ACCOUNT ↗</button></article>
            <article><small>05 / REVIEWS</small><h2>Who can leave a review?</h2><p>Reviews are available after a delivered order containing that product. Submitted reviews are checked before appearing publicly.</p></article>
            <article><small>06 / RETURNS</small><h2>How do returns and exchanges work?</h2><p>The store's return and exchange terms have not yet been published. Please confirm the policy with the store team before placing an order.</p></article>
            <article><small>07 / SUPPORT</small><h2>How can I contact STREET?</h2><p>Official contact details have not yet been configured on the website. The Contact page will be updated when the store's support channel is confirmed.</p><button className="text-button" onClick={() => go('contact')}>CONTACT PAGE ↗</button></article>
          </section>
          {footer()}
        </main>
      )}

      {page === 'wishlist' && (
        <main id="main-content" className="wishlist-page">
          <div className="page-kicker">STREET / YOUR SAVED PIECES</div>
          <div className="wishlist-heading"><div><small>KEEP YOUR FAVOURITES CLOSE</small><h1>WISHLIST</h1></div><span>{wish.length} SAVED ITEMS</span></div>
          {wish.length ? <div className="grid">{catalogProducts.filter((p) => wish.includes(p.id)).map((p, i) => <Fragment key={p.id}>{card(p, i + 1, wish.length)}</Fragment>)}</div> : <div className="wishlist-empty"><h2>NOTHING SAVED. YET.</h2><p>Save the pieces you like and they’ll be waiting here.</p><button className="solid" onClick={() => go('store')}>DISCOVER THE STORE</button></div>}
          {footer()}
        </main>
      )}

      {page === 'track' && (
        <main id="main-content" className="track-page">
          <div className="page-kicker">STREET / ORDER SUPPORT</div>
          <section className="track-panel">
            <small>YOUR ORDER, YOUR WAY</small><h1>TRACK<br />YOUR ORDER.</h1>
            <p>Enter the order number from your confirmation email to find your delivery details.</p>
            <form onSubmit={trackOrder}>
              <label htmlFor="track-code">ORDER NUMBER</label>
              <input id="track-code" value={trackCode} onChange={(e) => { setTrackCode(e.target.value); setTrackNotice(''); setTrackResult(null); }} placeholder="e.g. ST-10482" required />
              <button className="solid" type="submit">FIND MY ORDER ↗</button>
              {trackNotice && <span className="track-notice">{trackNotice}</span>}
            </form>
            {trackResult && <div className="track-result"><small>ORDER / {trackResult.order_number}</small><b>{trackResult.status.toUpperCase()}</b><span>PLACED {new Date(trackResult.created_at).toLocaleDateString()}</span><strong>{money(Number(trackResult.total))}</strong></div>}
            <span className="track-support">Private order details are available after signing in to your STREET account. <button onClick={() => go('account')}>SIGN IN ↗</button></span>
          </section>
          {footer()}
        </main>
      )}


      {page === 'new-arrivals' && (
        <main id="main-content" className="utility-page">
          <div className="page-kicker">STREET / JUST LANDED / 004</div>
          <div className="utility-heading"><small>THE LATEST ADDITIONS</small><h1>NEW<br/><span>ARRIVALS.</span></h1><p>Fresh pieces entering the STREET rotation.</p></div>
          {catalogProducts[0] && (
            <button className="drop-feature" onClick={() => openProduct(catalogProducts[0])}>
              <Img src={catalogProducts[0].images[0]} className="drop-feature-image" />
              <span className="drop-feature-kicker">STREET / NEW DROP / 001</span>
              <span className="drop-feature-copy"><small>JUST LANDED</small><b>{catalogProducts[0].name}</b><i>DISCOVER THE DROP ↗</i></span>
            </button>
          )}
          <div className="grid">{catalogProducts.slice(1,9).map((p,i)=><Fragment key={p.id}>{card(p,i+2, catalogProducts.length)}</Fragment>)}</div>
          {footer()}
        </main>
      )}

      {page === 'best-sellers' && (
        <main id="main-content" className="utility-page">
          <div className="page-kicker">STREET / THE ROTATION / 005</div>
          <div className="utility-heading"><small>THE CURRENT EDIT</small><h1>BEST<br/><span>SELLERS.</span></h1><p>A curated selection from the current STREET rotation. Verified sales rankings will replace this edit once orders are active.</p></div>
          <div className="grid">{catalogProducts.slice(0,8).map((p,i)=><Fragment key={p.id}>{card(p,i+1,8)}</Fragment>)}</div>
          {footer()}
        </main>
      )}

      {page === 'lookbook' && (
        <main id="main-content" className="utility-page lookbook-page">
          <div className="page-kicker">STREET / VISUAL STORIES / 006</div>
          <div className="utility-heading"><small>THE WAY WE SEE IT</small><h1>THE<br/><span>LOOKBOOK.</span></h1><p>Pieces are only the beginning. Build a look, make it personal, wear it your way.</p></div>
          <div className="lookbook-grid">
            {catalogProducts.filter((p)=>['PANTS','JACKETS','HOODIES','T-SHIRTS'].includes(p.category)).slice(0,6).map((p,i)=>(
              <button className="lookbook-tile" key={p.id} onClick={()=>openProduct(p)}><Img src={p.images[0]}/><span>STREET / FRAME {String(i+1).padStart(2,'0')}</span><b>{p.name}</b><i>DISCOVER PIECE ↗</i></button>
            ))}
          </div>
          {footer()}
        </main>
      )}

      {page === 'build-outfit' && (
        <main id="main-content" className="utility-page outfit-builder-page">
          <div className="page-kicker">STREET / PERSONAL STYLING / 007</div>
          <div className="utility-heading"><small>MAKE THE COMBINATION YOURS</small><h1>BUILD YOUR<br/><span>OUTFIT.</span></h1><p>Choose a bottom and a top from the current STREET collection.</p></div>
          <div className="outfit-builder">
            <div className="outfit-preview">
              <small>YOUR COMBINATION / LIVE PREVIEW</small>
              <div className="outfit-preview-pieces">{[outfitBottom,outfitTop].map((id)=>{const p=catalogProducts.find((item)=>item.id===id);return p?<button key={id} onClick={()=>openProduct(p)}><Img src={p.images[0]}/><b>{p.name}</b></button>:null})}</div>
              <span>STREET / STYLE IT YOUR WAY</span>
            </div>
            <div className="outfit-choices">
              <section><h2>01 / CHOOSE YOUR BOTTOM</h2><div>{catalogProducts.filter((p)=>p.category==='PANTS').map((p)=><button className={outfitBottom===p.id?'selected':''} key={p.id} onClick={()=>setOutfitBottom(p.id)}><Img src={p.images[0]}/><span>{p.name}</span></button>)}</div></section>
              <section><h2>02 / CHOOSE YOUR TOP</h2><div>{catalogProducts.filter((p)=>['HOODIES','JACKETS','T-SHIRTS'].includes(p.category)).map((p)=><button className={outfitTop===p.id?'selected':''} key={p.id} onClick={()=>setOutfitTop(p.id)}><Img src={p.images[0]}/><span>{p.name}</span></button>)}</div></section>
            </div>
          </div>
          {footer()}
        </main>
      )}

      {page === 'size-guide' && (
        <main id="main-content" className="utility-page">
          <div className="page-kicker">STREET / FIT REFERENCE / 008</div>
          <div className="utility-heading"><small>FIND YOUR FIT</small><h1>SIZE<br/><span>GUIDE.</span></h1><p>Use this page as a fit reference. Exact garment measurements will be published after the pieces are measured.</p></div>
          <div className="size-guide-page-table"><div><b>CATEGORY</b><b>AVAILABLE SIZES</b><b>MEASUREMENTS</b></div>{CATEGORIES.map((c)=><div key={c}><b>{c}</b><span>{Array.from(new Set(catalogProducts.filter((product)=>product.category===c).flatMap((product)=>product.sizes))).join(' / ') || 'NOT LISTED'}</span><span>GARMENT MEASUREMENTS TO BE CONFIRMED</span></div>)}</div>
          {footer()}
        </main>
      )}

      {page === 'checkout' && (
        <main id="main-content" className="utility-page checkout-page">
          <div className="page-kicker">STREET / SECURE CHECKOUT / 009</div>
          <div className="utility-heading"><small>ALMOST YOURS</small><h1>CHECK<br/><span>OUT.</span></h1><p>Place a cash-on-delivery order. Your prices, coupon and available stock are verified securely before the order is created.</p></div>
          {orderSuccess ? (
            <section className="checkout-success">
              <small>STREET / ORDER CONFIRMED</small><h2>YOU'RE<br/>IN.</h2>
              <p>YOUR ORDER NUMBER</p><strong>{orderSuccess.order_number}</strong>
              <div><span>ORDER TOTAL</span><b>{money(orderSuccess.total)}</b></div>
              <p className="checkout-note">PAYMENT METHOD: CASH ON DELIVERY. THE STORE TEAM WILL CONFIRM DELIVERY DETAILS.</p>
              {!orderSuccess.guest ? <button className="solid" onClick={()=>{setOrderSuccess(null);go('account')}}>VIEW MY ACCOUNT ↗</button> : <button className="solid" onClick={()=>{setOrderSuccess(null);go('store')}}>CONTINUE SHOPPING ↗</button>}
            </section>
          ) : cart.length === 0 ? (
            <div className="checkout-summary"><p>YOUR BAG IS EMPTY.</p><button onClick={()=>go('store')}>RETURN TO SHOP ↗</button></div>
          ) : (
            <div className="checkout-layout">
              <form className="checkout-form" onSubmit={submitCheckout}>
                <div className="checkout-form-head"><small>01 / DELIVERY DETAILS</small><span>{checkoutEmail ? 'ACCOUNT OR GUEST' : 'GUEST CHECKOUT'}</span></div>
                <label>EMAIL <span>OPTIONAL</span><input type="email" autoComplete="email" value={checkoutEmail} onChange={(e)=>setCheckoutEmail(e.target.value)} placeholder="name@example.com"/></label>
                <label>FULL NAME<input required minLength={2} autoComplete="name" value={checkoutName} onChange={(e)=>setCheckoutName(e.target.value)} placeholder="Full name"/></label>
                <label>PHONE NUMBER<input required type="tel" autoComplete="tel" minLength={7} value={checkoutPhone} onChange={(e)=>setCheckoutPhone(e.target.value)} placeholder="+20"/></label>
                <label>CITY / AREA<input required autoComplete="address-level2" value={checkoutCity} onChange={(e)=>setCheckoutCity(e.target.value)} placeholder="City"/></label>
                <label>DELIVERY ADDRESS<textarea required autoComplete="street-address" minLength={5} rows={3} value={checkoutAddress} onChange={(e)=>setCheckoutAddress(e.target.value)} placeholder="Street, building, floor and apartment"/></label>
                <label>ORDER NOTES <span>OPTIONAL</span><textarea rows={2} value={checkoutNotes} onChange={(e)=>setCheckoutNotes(e.target.value)} placeholder="Anything the delivery team should know"/></label>
                <div className="checkout-form-head"><small>02 / PAYMENT</small><span>CASH ON DELIVERY</span></div>
                <div className="checkout-payment-option"><b>CASH ON DELIVERY</b><span>Pay when your order arrives. No card details are collected by STREET.</span></div>
                <button className="solid checkout-submit" type="submit" disabled={checkoutBusy || checkoutShipping === null}>{checkoutBusy?'PLACING ORDER…':'PLACE ORDER ↗'}</button>
                {checkoutNotice && <p className="checkout-notice" role="status">{checkoutNotice}</p>}
                {checkoutShipping === null && <p className="checkout-notice">DELIVERY FEE IS NOT CONFIGURED YET. PLEASE CONTACT THE STORE.</p>}
              </form>
              <aside className="checkout-summary">
                <div className="checkout-form-head"><small>03 / YOUR BAG</small><span>{cartCount} PIECES</span></div>
                {cart.map((item)=><div className="checkout-line" key={item.product.id+item.size}><Img src={item.product.images[0]}/><span>{item.product.name}<small>{item.size} × {item.qty}</small></span><b>{money(item.product.price*item.qty)}</b></div>)}
                <div className="checkout-coupon"><label htmlFor="checkout-coupon">DISCOUNT CODE</label><div><input id="checkout-coupon" value={checkoutCoupon} onChange={(e)=>{setCheckoutCoupon(e.target.value.toUpperCase());setCheckoutCouponCode('');setCheckoutDiscount(0);setCheckoutNotice('')}} placeholder="ENTER CODE"/><button type="button" onClick={()=>void applyCheckoutCoupon()}>APPLY</button></div></div>
                <div className="checkout-totals"><p><span>SUBTOTAL</span><b>{money(subtotal)}</b></p><p><span>DISCOUNT {checkoutCouponCode && <i>{checkoutCouponCode}</i>}</span><b>− {moneyValue(checkoutDiscount)}</b></p><p><span>DELIVERY</span><b>{checkoutShipping===null?'TO BE CONFIRMED':moneyValue(checkoutShipping)}</b></p><footer><span>TOTAL</span><strong>{money(checkoutTotal)}</strong></footer></div>
                {checkoutNotice && <p className="checkout-notice" role="status">{checkoutNotice}</p>}
              </aside>
            </div>
          )}
          {footer()}
        </main>
      )}


      {page === 'account' && (
        <main id="main-content" className="utility-page account-page">
          <div className="page-kicker">STREET / YOUR ACCOUNT / 011</div>
          <div className="utility-heading"><small>YOUR STREET PROFILE</small><h1>YOUR<br/><span>ACCOUNT.</span></h1><p>Sign in to view your account and order history, or create an account for your next STREET order.</p></div>
          {!accountUser ? <form className="admin-login" onSubmit={submitAccount}><div className="account-mode"><button type="button" className={accountMode==='signin'?'on':''} onClick={()=>{setAccountMode('signin');setAccountNotice('')}}>SIGN IN</button><button type="button" className={accountMode==='signup'?'on':''} onClick={()=>{setAccountMode('signup');setAccountNotice('')}}>CREATE ACCOUNT</button></div>{accountMode==='signup'&&<><label>FULL NAME</label><input required value={accountName} onChange={(e)=>setAccountName(e.target.value)} placeholder="Your name"/></>}<label>EMAIL</label><input type="email" required value={accountEmail} onChange={(e)=>setAccountEmail(e.target.value)} placeholder="name@domain.com"/><label>PASSWORD</label><input type="password" required minLength={6} value={accountPassword} onChange={(e)=>setAccountPassword(e.target.value)} placeholder="At least 6 characters"/><button className="solid" type="submit">{accountMode==='signup'?'CREATE ACCOUNT ↗':'SIGN IN ↗'}</button>{accountNotice&&<p>{accountNotice}</p>}{accountMode==='signin'&&<button type="button" className="text-button" onClick={()=>void resendAccountConfirmation()}>RESEND CONFIRMATION EMAIL ↗</button>}</form> : <section className="account-orders"><div><h2>WELCOME BACK</h2><span>{accountUser}</span><button onClick={()=>void signOutAccount()}>SIGN OUT</button></div><h3>YOUR ORDERS</h3>{accountOrders.length===0?<p>NO ORDERS LINKED TO THIS ACCOUNT YET.</p>:accountOrders.map((o)=><article key={o.order_number}><b>{o.order_number}</b><span>{o.status.toUpperCase()}</span><strong>{money(Number(o.total))}</strong><small>{new Date(o.created_at).toLocaleDateString()}</small></article>)}</section>}
          {footer()}
        </main>
      )}

      {page === 'admin' && (
        <main id="main-content" className="utility-page admin-page modern-admin">
          <div className="admin-topbar">
            <div className="admin-brand"><span className="admin-brand-mark">S</span><div><b>STREET</b><small>COMMERCE / ADMIN</small></div></div>
            <div className="admin-topbar-meta"><span className="admin-live-dot" /> PRIVATE WORKSPACE <span className="admin-topbar-divider">/</span> 010</div>
          </div>
          <div className="admin-welcome">
            <div><small>OVERVIEW / CONTROL CENTER</small><h1>STORE<br/><span>COMMAND.</span></h1><p>Everything happening across your STREET store, in one place.</p></div>
            {adminUser && <div className="admin-session"><span>SIGNED IN AS</span><b>{adminUser}</b><button type="button" onClick={async()=>{await supabase.auth.signOut();setAdminUser(null);setAdminRole(null);setAdminNotice('SIGNED OUT.')}}>SIGN OUT ↗</button></div>}
          </div>
          {!adminUser ? (
            <form className="admin-login" onSubmit={adminSignIn}>
              <label>ADMIN EMAIL</label><input type="email" required value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} placeholder="name@domain.com"/>
              <label>PASSWORD</label><input type="password" required value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Your password"/>
              <button className="solid" type="submit">SIGN IN ↗</button>{adminNotice&&<p>{adminNotice}</p>}
            </form>
          ) : adminRole === 'admin' ? (
            <>
              <div className="admin-layout">
                <aside className="admin-sidebar">
                  <small>WORKSPACE</small>
                  <a className="admin-side-link active" href="#admin-overview"><span>01</span> Overview</a>
                  <a className="admin-side-link" href="#admin-create"><span>02</span> Add product</a>
                  <a className="admin-side-link" href="#admin-products"><span>03</span> Products</a>
                  <a className="admin-side-link" href="#admin-customers"><span>04</span> Customers</a>
                  <a className="admin-side-link" href="#admin-orders"><span>05</span> Orders</a>
                  <a className="admin-side-link" href="#admin-coupons"><span>06</span> Coupons</a>
                  <a className="admin-side-link" href="#admin-reviews"><span>07</span> Reviews</a>
                  <a className="admin-side-link" href="#admin-settings"><span>08</span> Settings</a>
                  <div className="admin-sidebar-bottom"><span className="admin-live-dot"/> STORE SYSTEM<br/><b>OPERATIONAL</b></div>
                </aside>
                <div className="admin-content">
              <section className="admin-analytics" aria-label="Order analytics">
                <div className="admin-analytics-head">
                  <div><small>COMMERCE / PERFORMANCE</small><h2>ORDER OVERVIEW</h2><span>BASED ON THE 100 MOST RECENT ORDERS LOADED</span></div>
                  <button type="button" onClick={exportAdminOrders}>EXPORT ORDERS CSV ↗</button>
                </div>
                <div className="admin-analytics-metrics">
                  <article><small>RECENT ORDER VALUE</small><strong>{money(adminOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))}</strong><span>NOT A PAYMENT SETTLEMENT TOTAL</span></article>
                  <article><small>DELIVERED</small><strong>{adminOrders.filter((order) => order.status === 'delivered').length}</strong><span>COMPLETED ORDERS</span></article>
                  <article><small>CANCELLED</small><strong>{adminOrders.filter((order) => order.status === 'cancelled').length}</strong><span>CANCELLED ORDERS</span></article>
                  <article><small>AVERAGE ORDER</small><strong>{adminOrders.length ? money(adminOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / adminOrders.length) : money(0)}</strong><span>RECENT RECORDS ONLY</span></article>
                </div>
                {adminExportNotice && <p className="admin-export-notice" role="status">{adminExportNotice}</p>}
              </section>
              <section id="admin-overview" className="admin-overview" aria-label="Store overview">
                <div><small>CATALOGUE</small><strong>{adminProducts.length}</strong><span>ALL PIECES</span></div>
                <div><small>LIVE</small><strong>{adminProducts.filter((p) => p.is_active).length}</strong><span>VISIBLE PRODUCTS</span></div>
                <div><small>ORDERS</small><strong>{adminOrders.length}</strong><span>RECENT RECORDS</span></div>
                <div><small>TO PROCESS</small><strong>{adminOrders.filter((o) => ['pending','confirmed','processing','shipped'].includes(o.status)).length}</strong><span>OPEN ORDERS</span></div>
                <div><small>CUSTOMERS</small><strong>{adminCustomers.length}</strong><span>REGISTERED ACCOUNTS</span></div>
              </section>
              <form id="admin-create" className="admin-create-product" onSubmit={createAdminProduct}>
                <div className="admin-section-title"><h2>ADD A NEW PIECE</h2><span>CATALOGUE ENTRY</span></div>
                <input required value={newProductName} onChange={(e)=>setNewProductName(e.target.value)} placeholder="PRODUCT NAME"/>
                <select value={newProductCategory} onChange={(e)=>setNewProductCategory(e.target.value as Category)}>{CATEGORIES.map((category)=><option key={category} value={category}>{category}</option>)}</select>
                <input inputMode="decimal" value={newProductPrice} onChange={(e)=>setNewProductPrice(e.target.value)} placeholder={`PRICE / EGP ${PRICE_RANGES[newProductCategory].min}–${PRICE_RANGES[newProductCategory].max}`}/>
                <button type="submit">CREATE PRODUCT ↗</button>
              </form>
              <section id="admin-products" className="admin-products">
                <div className="admin-section-title"><h2>PRODUCT CONTROL / {adminProducts.length}</h2><span>PRICES, STOCK, PHOTOS & VISIBILITY</span></div>
                {adminProducts.map((p)=><article key={p.id}>
                  <div><b>{p.name}</b><small>{p.category}</small></div>
                  <label><span>PRICE / EGP {PRICE_RANGES[p.category as Category].min}–{PRICE_RANGES[p.category as Category].max}</span><input aria-label={p.name+' price'} inputMode="decimal" value={adminPriceDrafts[p.id] ?? String(p.price ?? '')} placeholder="Set price" onChange={(e)=>setAdminPriceDrafts((drafts)=>({...drafts,[p.id]:e.target.value}))}/></label>
                  <button onClick={()=>void saveAdminPrice(p.id)}>SAVE</button>
                  <button className={p.is_active?'active':''} onClick={()=>void toggleAdminProduct(p.id,p.is_active)}>{p.is_active?'LIVE':'HIDDEN'}</button>
                  <div className="admin-stock-grid">{p.sizes.map((size)=><label key={size}><span>{size} / QTY</span><input aria-label={p.name+' '+size+' stock'} inputMode="numeric" value={adminStockDrafts[`${p.id}::${size}`] ?? ''} placeholder="Not set" onChange={(e)=>setAdminStockDrafts((drafts)=>({...drafts,[`${p.id}::${size}`]:e.target.value}))}/><button onClick={()=>void saveAdminStock(p.id,size)}>SAVE STOCK</button></label>)}</div>
                  <div className="admin-image-upload"><label>ADD PRODUCT IMAGE<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e)=>setAdminImageFiles((items)=>({...items,[p.id]:e.target.files?.[0] ?? null}))}/></label><button onClick={()=>void uploadAdminImage(p.id)}>UPLOAD IMAGE ↗</button></div>
                </article>)}
              </section>
              <section id="admin-customers" className="admin-customers">
                <div className="admin-section-title"><h2>CUSTOMER DIRECTORY / {adminCustomers.length}</h2><span>REGISTERED ACCOUNTS</span></div>
                {adminCustomers.length===0?<p>NO CUSTOMER ACCOUNTS YET.</p>:adminCustomers.map((customer,i)=><article key={customer.email ?? i}><b>{customer.full_name || 'STREET CUSTOMER'}</b><span>{customer.email}</span><small>{new Date(customer.created_at).toLocaleDateString()}</small></article>)}
              </section>
              <section id="admin-orders" className="admin-orders">
                <div><h2>RECENT ORDERS</h2><span>{adminOrders.length} / 100 RECORDS</span></div>
                {adminOrders.length===0?<p>NO ORDERS HAVE BEEN PLACED YET.</p>:adminOrders.map((o)=><article key={o.order_number}>
                  <b>{o.order_number}</b><span>{o.customer_name}<small className="admin-order-meta">{o.payment_method === 'cash_on_delivery' ? 'CASH ON DELIVERY' : (o.payment_method ?? 'PAYMENT UNSET')} / {(o.payment_status ?? 'unpaid').toUpperCase()}{o.coupon_code ? ' / '+o.coupon_code : ''}</small></span>
                  <select value={o.status} onChange={(e)=>void updateAdminOrder(o.order_number,e.target.value)}>
                    <option value="pending">PENDING</option><option value="confirmed">CONFIRMED</option><option value="processing">PROCESSING</option><option value="shipped">SHIPPED</option><option value="delivered">DELIVERED</option><option value="cancelled">CANCELLED</option>
                  </select>
                  <strong>{money(Number(o.total))}</strong>
                </article>)}
              </section>
              <section id="admin-coupons" className="admin-coupons">
                <div className="admin-section-title"><h2>DISCOUNT CODES / {adminCoupons.length}</h2><span>COUPON MANAGEMENT</span></div>
                <form className="admin-coupon-form" onSubmit={createAdminCoupon}>
                  <label>CODE<input required minLength={3} maxLength={32} value={newCouponCode} onChange={(e)=>setNewCouponCode(e.target.value.toUpperCase())} placeholder="STREET10"/></label>
                  <label>TYPE<select value={newCouponType} onChange={(e)=>setNewCouponType(e.target.value as 'percent'|'fixed')}><option value="percent">PERCENT</option><option value="fixed">FIXED EGP</option></select></label>
                  <label>VALUE<input required type="number" min="1" step="0.01" max={newCouponType==='percent'?100:undefined} value={newCouponValue} onChange={(e)=>setNewCouponValue(e.target.value)}/></label>
                  <label>MINIMUM EGP<input type="number" min="0" value={newCouponMin} onChange={(e)=>setNewCouponMin(e.target.value)}/></label>
                  <label>USAGE LIMIT<input type="number" min="1" value={newCouponLimit} onChange={(e)=>setNewCouponLimit(e.target.value)} placeholder="Unlimited"/></label>
                  <label>EXPIRES<input type="date" value={newCouponExpiry} onChange={(e)=>setNewCouponExpiry(e.target.value)}/></label>
                  <button type="submit">CREATE COUPON ↗</button>
                </form>
                {adminCoupons.length===0?<p>NO COUPONS CREATED YET.</p>:adminCoupons.map((coupon)=><article className="admin-coupon-row" key={coupon.id}><div><b>{coupon.code}</b><small>{coupon.discount_type==='percent'?coupon.discount_value+'% OFF':money(coupon.discount_value)+' OFF'} / MIN {money(coupon.min_subtotal)}</small></div><span>{coupon.used_count}{coupon.usage_limit===null?'':' / '+coupon.usage_limit} USED</span><small>{coupon.expires_at?'EXPIRES '+new Date(coupon.expires_at).toLocaleDateString():'NO EXPIRY'}</small><button className={coupon.is_active?'active':''} onClick={()=>void toggleAdminCoupon(coupon.id,coupon.is_active)}>{coupon.is_active?'ACTIVE':'PAUSED'}</button></article>)}
              </section>
              <section id="admin-reviews" className="admin-review-moderation">
                <div className="admin-section-title"><h2>REVIEW MODERATION / {adminReviews.filter((review)=>review.status==='pending').length} PENDING</h2><span>CUSTOMER FEEDBACK</span></div>
                {adminReviews.length===0?<p>NO CUSTOMER REVIEWS YET.</p>:adminReviews.map((review)=><article key={review.id}><div><b>{review.title}</b><span>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div><p>{review.body}</p><small>{review.product_id} / {review.status.toUpperCase()} / {new Date(review.created_at).toLocaleDateString()}</small>{review.status==='pending'&&<div><button onClick={()=>void moderateReview(review.id,'approved')}>APPROVE</button><button onClick={()=>void moderateReview(review.id,'rejected')}>REJECT</button></div>}</article>)}
              </section>
              <section id="admin-settings" className="admin-store-settings">
                <div className="admin-section-title"><h2>STORE SETTINGS</h2><span>DELIVERY CONFIGURATION</span></div>
                <form onSubmit={saveAdminShipping}><label>STANDARD DELIVERY FEE / EGP<input required type="number" min="0" step="1" value={adminShippingDraft} onChange={(e)=>setAdminShippingDraft(e.target.value)} placeholder="Enter delivery fee"/></label><button type="submit">SAVE DELIVERY FEE ↗</button></form>
                <p>Checkout remains unavailable until a delivery fee is configured. Payment is currently cash on delivery only.</p>
              </section>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-message">{adminNotice||'THIS ACCOUNT DOES NOT HAVE ADMIN PERMISSIONS.'}<button onClick={async()=>{await supabase.auth.signOut();setAdminUser(null);setAdminRole(null);setAdminNotice('SIGNED OUT.')}}>SIGN OUT</button></div>
          )}
          {footer()}
        </main>
      )}

      {['purchase-terms','style-terms','privacy','cookies','ai-terms','sitemap','cookie-settings','market-language'].includes(page) && (
        <main id="main-content" className="utility-page legal-page">
          <div className="utility-heading">
            <small>STREET / INFORMATION</small>
            <h1>{({
              'purchase-terms':'TERMS OF PURCHASE',
              'style-terms':'#STREETSTYLE',
              privacy:'PRIVACY POLICY',
              cookies:'COOKIES POLICY',
              'ai-terms':'USE OF AI',
              sitemap:'SITEMAP',
              'cookie-settings':'COOKIE SETTINGS',
              'market-language':'MARKET & LANGUAGE',
            } as Record<string,string>)[page]}</h1>
            <p>EGYPT · ENGLISH · LAST UPDATED 24 NOVEMBER 2026</p>
          </div>
          {page === 'purchase-terms' && <section className="legal-copy">
            <div className="legal-notice">DRAFT STORE TERMS — Please have these terms reviewed for your business and applicable Egyptian consumer and e-commerce requirements before publishing as final legal terms.</div>
            <article><h2>01 / ABOUT THESE TERMS</h2><p>These terms explain how orders are placed through STREET's online store. By submitting an order, you confirm that the information you provide is accurate and that you have read these terms.</p></article>
            <article><h2>02 / PRODUCTS AND AVAILABILITY</h2><p>We aim to show product images, descriptions, colours and sizes as accurately as possible. Display colours may vary between screens. Product availability is based on the live size-level stock shown on the website and is checked again when an order is submitted. Adding an item to your bag does not reserve it.</p></article>
            <article><h2>03 / PRICES AND PAYMENT</h2><p>Prices are displayed in Egyptian pounds (EGP). The delivery fee and any discount are shown in the checkout summary before you place your order. Cash on delivery is the payment method currently supported by STREET. Do not send payment-card details through website forms or messages.</p></article>
            <article><h2>04 / PLACING AN ORDER</h2><p>When you submit checkout, you are sending an order request. STREET checks the product, selected size, price and available stock before creating the order. An on-screen order confirmation means the order has been recorded by the store; if we cannot fulfil it, we will use the contact details supplied to discuss the next step.</p></article>
            <article><h2>05 / DELIVERY</h2><p>Available delivery options and the applicable fee are displayed at checkout. Delivery timing may depend on the destination and courier arrangements. If an order is delayed, the store should provide an update using the contact details on the order.</p></article>
            <article><h2>06 / CANCELLATIONS, RETURNS AND EXCHANGES</h2><p>STREET's detailed cancellation, return and exchange procedure has not yet been configured on this website. Please contact the store before ordering if you need to confirm eligibility or process. Nothing in these draft terms is intended to remove any rights that cannot legally be excluded.</p></article>
            <article><h2>07 / ACCOUNT AND WEBSITE USE</h2><p>You can place an order as a guest without creating an account. If you sign in, your order can be linked to your account; guest orders are not added to an account order history. Please provide accurate delivery and contact details. Do not misuse the website, attempt unauthorised access, interfere with its operation or submit unlawful content.</p></article>
            <article><h2>08 / CONTACT AND CHANGES</h2><p>For order questions, use the Contact or Help pages on this website. STREET may update product information and these terms when store operations change. The version displayed on this page is the version currently presented by the website.</p></article>
          </section>}
          {page === 'style-terms' && <section className="legal-copy">
            <div className="legal-notice">Community guidelines for any future STREET hashtag or repost campaign. No public submission or repost campaign is currently promised by this page.</div>
            <article><h2>01 / YOUR CONTENT</h2><p>Only share photos, videos and captions that you created or have permission to use. Do not post another person's image, artwork, music or other protected material without permission.</p></article>
            <article><h2>02 / PERMISSION TO REPOST</h2><p>Using a STREET hashtag by itself does not transfer ownership of your content or automatically grant STREET permission to publish it. If STREET asks to repost your content, we will request clear permission and explain the intended use before publication.</p></article>
            <article><h2>03 / COMMUNITY STANDARDS</h2><p>Do not submit content that is unlawful, misleading, discriminatory, harassing, explicit, dangerous, or that exposes another person's private information. Do not impersonate STREET or suggest that you are officially affiliated with the brand.</p></article>
            <article><h2>04 / YOUR RIGHTS</h2><p>You keep ownership of content you create. You can withdraw permission for a future repost by contacting STREET through the website's Contact page. This may not remove copies already shared by other users or platforms.</p></article>
          </section>}
          {page === 'privacy' && <section className="legal-copy">
            <div className="legal-notice">This is a plain-language draft based on the features currently visible in the STREET store. Confirm the legal business identity, contact details, retention periods and service-provider list before launch.</div>
            <article><h2>01 / INFORMATION WE HANDLE</h2><p>Depending on how you use the store, information may include your account email and profile name; order name, phone number, delivery address, city and order notes; products, sizes and quantities ordered; and support messages you choose to send.</p></article>
            <article><h2>02 / WHY WE USE IT</h2><p>We use order information to process purchases, check stock, arrange delivery, provide order history and respond to support requests. Account information is used to sign you in and maintain your account. Cart, wishlist and basic experience preferences may be stored in your browser.</p></article>
            <article><h2>03 / SERVICE PROVIDERS</h2><p>The store uses third-party infrastructure for hosting, authentication and database services, including Supabase and the website hosting provider. Those providers may process information as needed to operate the service. Delivery information may need to be shared with a courier when an order is fulfilled.</p></article>
            <article><h2>04 / SHARING AND SECURITY</h2><p>STREET does not offer customer information for sale. Access to order and account information should be limited to people who need it to operate the store. Online services cannot guarantee absolute security, so please use a unique password and avoid sending sensitive information in order notes.</p></article>
            <article><h2>05 / STORAGE AND YOUR CHOICES</h2><p>Information is kept for as long as needed to operate the store, meet applicable obligations and resolve order issues. Specific retention periods and a formal privacy contact must be confirmed by the store owner. You may request access, correction or deletion where applicable by using the Contact page.</p></article>
            <article><h2>06 / CHILDREN AND UPDATES</h2><p>The store is not designed to knowingly collect personal information from children without appropriate permission. This policy may be updated as store features and legal requirements change.</p></article>
          </section>}
          {page === 'cookies' && <section className="legal-copy">
            <article><h2>01 / BROWSER STORAGE</h2><p>STREET uses essential browser storage to keep core store features working, such as your shopping bag, wishlist, intro preference and sign-in session. Some of this storage may be local storage or session storage rather than traditional cookies.</p></article>
            <article><h2>02 / OPTIONAL TRACKING</h2><p>This version of the store does not intentionally enable optional advertising or analytics trackers. If optional tools are added later, this page and Cookie Settings should be updated and consent collected where required.</p></article>
            <article><h2>03 / MANAGING YOUR CHOICES</h2><p>You can review the current preference controls through Cookie Settings. Blocking essential browser storage may affect sign-in, the shopping bag, wishlist and other store features.</p></article>
          </section>}
          {page === 'ai-terms' && <section className="legal-copy">
            <article><h2>01 / CURRENT EXPERIENCE</h2><p>STREET's shopping experience is based on product information entered by the store and the stock and order systems connected to the website. This page does not represent that a customer-facing generative AI feature is currently available.</p></article>
            <article><h2>02 / FUTURE AI-ASSISTED FEATURES</h2><p>If STREET introduces AI-assisted search, styling, support or content features, the store should explain what the feature does, what information it uses and where human review is available before the feature is launched.</p></article>
            <article><h2>03 / IMPORTANT LIMITS</h2><p>Any future AI-generated suggestions should be treated as general assistance, not a guarantee of product fit, availability, delivery timing or professional advice. Product specifications and order confirmations shown by the store remain the reference for purchases.</p></article>
          </section>}
          {page === 'sitemap' && <section className="legal-sitemap">
            {([
              ['SHOP', [['Shop all','/shop'],['Collections','/collections'],['New arrivals','/new-arrivals'],['Best sellers','/best-sellers'],['Lookbook','/lookbook'],['Build your outfit','/build-outfit'],['Size guide','/size-guide']]],
              ['YOUR ACCOUNT', [['Account','/account'],['Wishlist','/wishlist'],['Order tracking','/track'],['Checkout','/checkout']]],
              ['SUPPORT', [['Help & FAQs','/help'],['Contact','/contact'],['Studio','/studio']]],
              ['LEGAL & SETTINGS', [['Terms of purchase','/purchase-terms'],['#STREETSTYLE terms','/style-terms'],['Privacy policy','/privacy'],['Cookies policy','/cookies'],['Cookie settings','/cookie-settings'],['Use of AI','/ai-terms'],['Market & language','/market-language']]],
            ] as [string, string[][]][]).map(([heading,items]) => <section key={heading}><h2>{heading}</h2>{items.map(([label,path]) => <a key={path} href={path}>{label}<span>↗</span></a>)}</section>)}
          </section>}
          {page === 'cookie-settings' && <section className="legal-copy cookie-settings-panel">
            <p>Essential storage is always active because it supports sign-in, your shopping bag and basic store functions. Optional categories are currently off by default.</p>
            <div className="cookie-option"><div><b>ESSENTIAL</b><small>Required for core store functionality. Always active.</small></div><input type="checkbox" checked disabled aria-label="Essential storage always active"/></div>
            <div className="cookie-option"><div><b>ANALYTICS</b><small>Would help understand aggregate site usage if an analytics service is added.</small></div><input type="checkbox" checked={cookiePrefs.analytics} onChange={(e)=>{setCookiePrefs((p)=>({...p,analytics:e.target.checked}));setCookieSaved(false)}} aria-label="Analytics preference"/></div>
            <div className="cookie-option"><div><b>MARKETING</b><small>Would be used for advertising measurement or personalised marketing if such tools are added.</small></div><input type="checkbox" checked={cookiePrefs.marketing} onChange={(e)=>{setCookiePrefs((p)=>({...p,marketing:e.target.checked}));setCookieSaved(false)}} aria-label="Marketing preference"/></div>
            <button className="legal-save-button" onClick={()=>{localStorage.setItem('street-cookie-preferences-v1',JSON.stringify(cookiePrefs));setCookieSaved(true)}}>SAVE MY PREFERENCES ↗</button>
            {cookieSaved && <p className="legal-saved" role="status">YOUR PREFERENCES HAVE BEEN SAVED ON THIS DEVICE.</p>}
          </section>}
          {page === 'market-language' && <section className="legal-copy market-panel">
            <div className="market-current"><small>CURRENT STORE REGION</small><b>EGYPT</b><span>EGP / ENGLISH</span></div>
            <p>STREET currently serves the Egypt storefront in English. Additional markets, currencies and translated storefronts are not available yet.</p>
            <label>MARKET<select value="EG" disabled><option value="EG">Egypt</option></select></label>
            <label>LANGUAGE<select value="en" disabled><option value="en">English</option></select></label>
          </section>}
          {footer()}
        </main>
      )}

      {/* menu overlay */}
      <div className={`menu ${menu ? 'open' : ''}`}>
        <button className="x" onClick={() => setMenu(false)}>{Icon.close}</button>
        <div className="menu-in">
          <Logo className="menu-logo" />
          <small>{dateStr} · {timeStr}</small>
          <ul>
            {NAV.map((n) => <li key={n.label} onClick={() => go(n.page)}>{n.label}<span> →</span></li>)}
          </ul>
        </div>
      </div>

      {/* search overlay */}
      {search && (
        <div className="search">
          <div className="s-top">
            {Icon.search}
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="WHAT ARE YOU LOOKING FOR?" />
            <button onClick={() => setSearch(false)}>{Icon.close}</button>
          </div>
          <small>FEATURED PRODUCTS</small>
          <div className="s-grid">{results.map((p, i) => <Fragment key={p.id}>{card(p, i + 1, results.length)}</Fragment>)}</div>
          <small>COLLECTIONS</small>
          <ul className="s-cols">
            {CATEGORIES.map((c) => <li key={c} onClick={() => openCollection(c)}>{categoryLabel(c)}<span>COLLECTION</span></li>)}
          </ul>
        </div>
      )}

      {/* quick view */}
      {quickView && (
        <div className="quick-view-scrim" role="presentation" onClick={() => setQuickView(null)}>
          <section className="quick-view-panel" role="dialog" aria-modal="true" aria-label={`Quick view ${quickView.name}`} onClick={(event) => event.stopPropagation()}>
            <button className="quick-view-close" type="button" onClick={() => setQuickView(null)} aria-label="Close quick view">{Icon.close}</button>
            <div className="quick-view-image"><Img src={quickView.images[0]} /></div>
            <div className="quick-view-copy">
              <small>STREET / {quickView.category} / QUICK VIEW</small>
              <h2>{quickView.name}</h2>
              <strong>{money(quickView.price)}</strong>
              <span className="quick-view-rule" />
              <label>SELECT SIZE</label>
              <div className="quick-view-sizes">{quickView.sizes.map((size) => <button type="button" key={size} disabled={Boolean(quickView.stockBySize && (quickView.stockBySize[size] ?? 0) <= 0)} className={quickViewSize === size ? 'on' : ''} onClick={() => setQuickViewSize(size)}>{size}</button>)}</div>
              <button className="quick-view-add" type="button" disabled={quickView.soldOut || !quickViewSize || Boolean(quickView.stockBySize && (quickView.stockBySize[quickViewSize] ?? 0) <= 0)} onClick={() => { add(quickView, quickViewSize); setQuickView(null) }}>{quickView.soldOut ? 'SOLD OUT' : 'ADD TO BAG'} <span>{money(quickView.price)}</span></button>
              <button className="quick-view-details" type="button" onClick={() => { const product = quickView; setQuickView(null); openProduct(product) }}>VIEW FULL PRODUCT DETAILS ↗</button>
            </div>
          </section>
        </div>
      )}

      {/* cart drawer */}
      <div className={`scrim ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`drawer ${cartOpen ? 'open' : ''}`}>
        <div className="d-head"><span>CART ({cartCount})</span><button onClick={() => setCartOpen(false)}>{Icon.close}</button></div>
        <div className="ship">
          <div><span>CART SUBTOTAL</span><b>{money(subtotal)}</b></div>
        </div>
        <div className="d-items">
          {cart.length === 0 && <p className="empty">Your cart is empty.</p>}
          {cart.map((it, i) => (
            <div className="d-item" key={`${it.product.id}${it.size}`}>
              <Img src={it.product.images[0]} className="d-th" />
              <div>
                <b>{it.product.name}</b>
                <small>{it.size} / {it.product.color === '#1b1a8a' ? 'NAVY' : 'BLACK'} / COTTON</small>
                <div className="qty sm">
                  <button onClick={() => setCart((c) => c.map((x, k) => (k === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>−</button>
                  <span>{it.qty}</span>
                  <button disabled={Boolean(it.product.stockBySize && it.qty >= (it.product.stockBySize[it.size] ?? 0))} onClick={() => setCart((c) => c.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x)))}>+</button>
                  <button className="trash" onClick={() => setCart((c) => c.filter((_, k) => k !== i))}>🗑</button>
                </div>
              </div>
              <span>{money(it.product.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="d-foot">
          <div className="sub"><span>SUBTOTAL</span><b>{money(subtotal)}</b></div>
          <small>CASH ON DELIVERY CHECKOUT OPENS AFTER THE DELIVERY FEE AND REAL STOCK ARE CONFIGURED IN ADMIN.</small>
          <button className="solid" onClick={() => go('checkout')}>REVIEW CHECKOUT ↗</button>
          <button className="outline" onClick={() => setCartOpen(false)}>CONTINUE SHOPPING</button>
          <Pay />
        </div>
      </aside>


    </div>
  )
}
