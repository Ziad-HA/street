import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { CSSProperties } from 'react'
import { Logo3D } from './Logo3D'
import { ANNOUNCEMENTS, ASSETS, BRAND, TRACK } from './config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from './mark'
import { CATEGORIES, PRODUCTS, SIZES } from './data'
import type { Category, Product } from './data'
import './App.css'
import { supabase } from './lib/supabase'

type Page = 'intro' | 'hero' | 'store' | 'collections' | 'collection' | 'product' | 'studio' | 'contact' | 'wishlist' | 'track' | 'new-arrivals' | 'best-sellers' | 'lookbook' | 'build-outfit' | 'size-guide' | 'checkout' | 'account' | 'admin'

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
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const clickAudio = useRef<AudioContext | null>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const pending = useRef<string | undefined>(undefined)

  useEffect(() => { localStorage.setItem('street-cart-v2', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('street-wishlist-v2', JSON.stringify(wish)) }, [wish])
  useEffect(() => { localStorage.setItem('street-recently-viewed-v2', JSON.stringify(recentIds)) }, [recentIds])

  useEffect(() => {
    let alive = true
    const loadCatalogPrices = async () => {
      const { data, error } = await supabase.from('products').select('id,name,category,price,is_active,images,sizes,color,description,created_at').eq('is_active', true).order('created_at', { ascending: false })
      if (!alive || error || !data) return
      const next: Product[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category as Category,
        price: row.price == null ? defaultPriceFor(row.category as Category) : Number(row.price),
        sizes: row.sizes ?? [],
        images: row.images ?? [],
        color: row.color ?? '#292929',
        details: row.description ? [row.description] : [],
      }))
      setCatalogProducts(next)
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
        noiseGain.gain.setValueAtTime(0.16, now)
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
        toneGain.gain.setValueAtTime(0.055, now)
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
    const a = audio.current
    if (!a) return
    a.muted = muted
    if (playing) a.play().catch(() => setPlaying(false))
    else a.pause()
  }, [playing, muted])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

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
  const [openDetails, setOpenDetails] = useState(true)
  const [trackCode, setTrackCode] = useState('')
  const [trackNotice, setTrackNotice] = useState('')
  const [trackResult, setTrackResult] = useState<{order_number:string;status:string;created_at:string;total:number}|null>(null)
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
  const [adminOrders, setAdminOrders] = useState<Array<{order_number:string; customer_name:string; total:number; status:string; created_at:string}>>([])
  const [adminProducts, setAdminProducts] = useState<Array<{id:string;name:string;category:string;price:number|null;is_active:boolean;sizes:string[];images:string[]}>>([])
  const [adminCustomers, setAdminCustomers] = useState<Array<{email:string|null;full_name:string|null;created_at:string}>>([])
  const [adminPriceDrafts, setAdminPriceDrafts] = useState<Record<string,string>>({})
  const [adminStockDrafts, setAdminStockDrafts] = useState<Record<string,string>>({})
  const [adminImageFiles, setAdminImageFiles] = useState<Record<string,File|null>>({})
  const [newProductName, setNewProductName] = useState('')
  const [newProductCategory, setNewProductCategory] = useState<Category>('PANTS')
  const [newProductPrice, setNewProductPrice] = useState('')


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
        const { data: orders } = await supabase.from('orders').select('order_number,customer_name,total,status,created_at').order('created_at', { ascending: false }).limit(30)
        if (alive) setAdminOrders(orders ?? [])
        const { data: products } = await supabase.from('products').select('id,name,category,price,is_active,sizes,images').order('category').order('name')
        if (alive) { setAdminProducts(products ?? []); setAdminPriceDrafts(Object.fromEntries((products ?? []).map((p) => [p.id, p.price == null ? '' : String(p.price)]))) }
        const { data: stock } = await supabase.from('inventory').select('product_id,size,quantity')
        if (alive) setAdminStockDrafts(Object.fromEntries((stock ?? []).map((row) => [`${row.product_id}::${row.size}`, String(row.quantity)])))
        const { data: customers } = await supabase.from('profiles').select('email,full_name,created_at').order('created_at', { ascending: false }).limit(50)
        if (alive) setAdminCustomers(customers ?? [])
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
    const { data: orders } = await supabase.from('orders').select('order_number,customer_name,total,status,created_at').order('created_at', { ascending: false }).limit(30)
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
  }

  const showQuickView = (product: Product) => {
    setQuickView(product)
    setQuickViewSize(product.sizes[0] ?? '')
  }

  const add = (p: Product, size: string, q = 1) => {
    if (p.soldOut) return
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
    const product: Product = { id: data.id, name: data.name, category: data.category as Category, price: data.price == null ? 0 : Number(data.price), sizes: data.sizes, images: data.images ?? [], color: '#292929', details: ['Product information will be updated.'] }
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

  const updateAdminOrder = async (order_number: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('order_number', order_number)
    if (error) { setAdminNotice(error.message); return }
    setAdminOrders((items) => items.map((item) => item.order_number === order_number ? { ...item, status } : item))
  }

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const subtotal = cart.reduce((n, i) => n + i.product.price * i.qty, 0)
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
      <div className="hdr-logo" onClick={() => go('hero')}>
          <Logo3D pose={{ rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0} fov={30} />
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
          ['ORDER STATUS', 'Tracking once order tools are connected'],
          ['SUPPORT', 'Official contact details coming soon'],
        ].map(([a, b]) => (
          <div key={a}><i />{<div><b>{a}</b><small>{b}</small></div>}</div>
        ))}
      </div>
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
      </nav>
      <div className="foot-mid">
        <span>Inspired By {BRAND}</span>
        <div><span className="secure">Order and payment details will be confirmed at checkout.</span><Pay /></div>
      </div>
      <div className="footer-mark"><Logo className="footer-logo" /></div>
    </footer>
  )

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
        <main className="store shop-page">
          <section className="shop-masthead">
            <div className="shop-masthead-copy">
              <div className="page-kicker">STREET / PRODUCT DATABASE / 001</div>
              <small>THE CURRENT ROTATION</small>
              <h1>SHOP<br /><span>ALL PIECES.</span></h1>
              <p>Explore the complete STREET catalogue. Filter by category, find your fit, and build your rotation.</p>
            </div>
            <div className="shop-masthead-visual">
              <video src={ASSETS.storeHero} autoPlay muted loop playsInline />
              <span>LIVE CATALOGUE / 030 ITEMS</span>
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
        <main className="collections-page">
          <div className="page-kicker">STREET / CURATED EDITS / 002</div>
          <section className="collections-intro">
            <small>NOT A PRODUCT LIST. A POINT OF VIEW.</small>
            <h1>THE<br /><span>COLLECTIONS.</span></h1>
            <p>Shop is the complete catalogue. Collections are curated edits — grouped by mood, purpose and the way pieces work together.</p>
          </section>
          <section className="edit-grid">
            {[
              {no:'01',name:'THE PANTS EDIT',desc:'Relaxed fits, denim and everyday utility trousers.',cat:'PANTS',meta:'PANTS'},
              {no:'02',name:'THE HOODIE EDIT',desc:'Heavyweight hoodies and zip-ups for everyday rotation.',cat:'HOODIES',meta:'HOODIES'},
            ].map((edit) => (
              <button className="edit-card" key={edit.no} onClick={() => openCollection(edit.cat as Category)}>
                <div className="edit-card-art"><span>STREET / EDIT {edit.no}</span><b>{edit.name}</b><i>↗</i></div>
                <div className="edit-card-copy"><div><small>{edit.meta}</small><h2>{edit.name}</h2><p>{edit.desc}</p></div><span>EXPLORE EDIT ↗</span></div>
              </button>
            ))}
          </section>
          {footer()}
        </main>
      )}

      {page === 'collection' && (
        <main className="collection">
          <h1>{categoryLabel(category)}</h1>
          <small>{filtered.length} PRODUCTS</small>
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button key={c} className={c === category ? 'on' : ''} onClick={() => { setCategory(c); setSizeFilter(null); window.history.pushState({}, '', `/collections/${encodeURIComponent(String(c).toLowerCase())}`) }}>{categoryLabel(c as Category)}</button>
            ))}
          </div>
          <div className="toolbar">
            <div className="sz"><span>SIZE</span>{SIZES.map((s) => (
              <button key={s} className={sizeFilter === s ? 'on' : ''} onClick={() => setSizeFilter(sizeFilter === s ? null : s)}>{s}</button>
            ))}</div>
            <div className="tools">
              <label className="sort-label">SORT BY <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>
              <label>IN STOCK <i className={`tog ${inStock ? 'on' : ''}`} onClick={() => setInStock(!inStock)}><b /></i></label>
              <label className="price-filter">MIN EGP <input aria-label="Minimum price" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" /></label>
              <label className="price-filter">MAX EGP <input aria-label="Maximum price" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="—" /></label>
              {(minPrice || maxPrice || sizeFilter || inStock) && <button className="clear-filters" type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); setSizeFilter(null); setInStock(false) }}>CLEAR FILTERS ×</button>
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
        <main className="pdp">
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
              <div className="product-title-line"><h1>{active.name}</h1><div className="p-price">{money(active.price)}</div></div>
              <div className="product-color-row"><div className="swatch" style={{ background: active.color }} /><span>SELECTED COLOUR</span></div>
              <div className="product-size-head"><label>SIZE</label><button type="button" onClick={() => setSizeGuideOpen((open) => !open)}>SIZE GUIDE</button></div>
              <div className="sizes">
                {active.sizes.map((s) => <button key={s} className={sizeSel === s ? 'on' : ''} onClick={() => setSizeSel(s)}>{s}</button>)}
              </div>
              {sizeGuideOpen && <div className="size-guide"><b>SIZE GUIDE</b><p>Compare these with a similar item you own. Verified garment measurements will be added when available.</p><div className="size-guide-table"><span>SIZE</span><span>CHEST</span><span>LENGTH</span>{active.sizes.map((size) => <Fragment key={size}><span>{size}</span><span>—</span><span>—</span></Fragment>)}</div></div>}
              <div className="product-quantity"><label>QUANTITY</label><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div></div>
              <button className="product-add" disabled={active.soldOut} onClick={() => add(active, sizeSel, qty)}>{active.soldOut ? 'SOLD OUT' : 'ADD TO BAG'} <span>{money(active.price)}</span></button>
              <div className="product-info-links"><button type="button" onClick={() => setOpenDetails(!openDetails)}>PRODUCT DETAILS <span>{openDetails ? '−' : '+'}</span></button>{openDetails && <ul className="details">{active.details.map((d) => <li key={d}>{d}</li>)}</ul>}<button type="button">DELIVERY & RETURNS <span>+</span></button></div>
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
        <main className="studio-page">
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
        <main className="contact-page">
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

      {page === 'wishlist' && (
        <main className="wishlist-page">
          <div className="page-kicker">STREET / YOUR SAVED PIECES</div>
          <div className="wishlist-heading"><div><small>KEEP YOUR FAVOURITES CLOSE</small><h1>WISHLIST</h1></div><span>{wish.length} SAVED ITEMS</span></div>
          {wish.length ? <div className="grid">{catalogProducts.filter((p) => wish.includes(p.id)).map((p, i) => <Fragment key={p.id}>{card(p, i + 1, wish.length)}</Fragment>)}</div> : <div className="wishlist-empty"><h2>NOTHING SAVED. YET.</h2><p>Save the pieces you like and they’ll be waiting here.</p><button className="solid" onClick={() => go('store')}>DISCOVER THE STORE</button></div>}
          {footer()}
        </main>
      )}

      {page === 'track' && (
        <main className="track-page">
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
        <main className="utility-page">
          <div className="page-kicker">STREET / JUST LANDED / 004</div>
          <div className="utility-heading"><small>THE LATEST ADDITIONS</small><h1>NEW<br/><span>ARRIVALS.</span></h1><p>Fresh pieces entering the STREET rotation.</p></div>
          <div className="grid">{catalogProducts.slice(0,8).map((p,i)=><Fragment key={p.id}>{card(p,i+1,8)}</Fragment>)}</div>
          {footer()}
        </main>
      )}

      {page === 'best-sellers' && (
        <main className="utility-page">
          <div className="page-kicker">STREET / THE ROTATION / 005</div>
          <div className="utility-heading"><small>THE CURRENT EDIT</small><h1>BEST<br/><span>SELLERS.</span></h1><p>A curated selection from the current STREET rotation. Verified sales rankings will replace this edit once orders are active.</p></div>
          <div className="grid">{catalogProducts.slice(0,8).map((p,i)=><Fragment key={p.id}>{card(p,i+1,8)}</Fragment>)}</div>
          {footer()}
        </main>
      )}

      {page === 'lookbook' && (
        <main className="utility-page lookbook-page">
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
        <main className="utility-page outfit-builder-page">
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
        <main className="utility-page">
          <div className="page-kicker">STREET / FIT REFERENCE / 008</div>
          <div className="utility-heading"><small>FIND YOUR FIT</small><h1>SIZE<br/><span>GUIDE.</span></h1><p>Use this page as a fit reference. Exact garment measurements will be published after the pieces are measured.</p></div>
          <div className="size-guide-page-table"><div><b>CATEGORY</b><b>AVAILABLE SIZES</b><b>MEASUREMENTS</b></div>{CATEGORIES.map((c)=><div key={c}><b>{c}</b><span>{c==='PANTS'?'30 / 32 / 34 / 36 / 38 / 40 / 42':'S / M / L / XL'}</span><span>TO BE CONFIRMED</span></div>)}</div>
          {footer()}
        </main>
      )}

      {page === 'checkout' && (
        <main className="utility-page checkout-page">
          <div className="page-kicker">STREET / SECURE CHECKOUT / 009</div>
          <div className="utility-heading"><small>ALMOST YOURS</small><h1>CHECK<br/><span>OUT.</span></h1><p>Review your selected pieces. Checkout will open once verified prices, delivery fees and a payment method are configured.</p></div>
          <div className="checkout-summary">{cart.length===0?<p>YOUR BAG IS EMPTY.</p>:cart.map((item)=><div key={item.product.id+item.size}><Img src={item.product.images[0]}/><span>{item.product.name} / {item.size} × {item.qty}</span><b>{money(item.product.price*item.qty)}</b></div>)}<footer><span>SUBTOTAL</span><b>{money(subtotal)}</b></footer><button disabled>CHECKOUT UNAVAILABLE — SETUP REQUIRED</button></div>
          {footer()}
        </main>
      )}


      {page === 'account' && (
        <main className="utility-page account-page">
          <div className="page-kicker">STREET / YOUR ACCOUNT / 011</div>
          <div className="utility-heading"><small>YOUR STREET PROFILE</small><h1>YOUR<br/><span>ACCOUNT.</span></h1><p>Sign in to view your account and order history, or create an account for your next STREET order.</p></div>
          {!accountUser ? <form className="admin-login" onSubmit={submitAccount}><div className="account-mode"><button type="button" className={accountMode==='signin'?'on':''} onClick={()=>{setAccountMode('signin');setAccountNotice('')}}>SIGN IN</button><button type="button" className={accountMode==='signup'?'on':''} onClick={()=>{setAccountMode('signup');setAccountNotice('')}}>CREATE ACCOUNT</button></div>{accountMode==='signup'&&<><label>FULL NAME</label><input required value={accountName} onChange={(e)=>setAccountName(e.target.value)} placeholder="Your name"/></>}<label>EMAIL</label><input type="email" required value={accountEmail} onChange={(e)=>setAccountEmail(e.target.value)} placeholder="name@domain.com"/><label>PASSWORD</label><input type="password" required minLength={6} value={accountPassword} onChange={(e)=>setAccountPassword(e.target.value)} placeholder="At least 6 characters"/><button className="solid" type="submit">{accountMode==='signup'?'CREATE ACCOUNT ↗':'SIGN IN ↗'}</button>{accountNotice&&<p>{accountNotice}</p>}{accountMode==='signin'&&<button type="button" className="text-button" onClick={()=>void resendAccountConfirmation()}>RESEND CONFIRMATION EMAIL ↗</button>}</form> : <section className="account-orders"><div><h2>WELCOME BACK</h2><span>{accountUser}</span><button onClick={()=>void signOutAccount()}>SIGN OUT</button></div><h3>YOUR ORDERS</h3>{accountOrders.length===0?<p>NO ORDERS LINKED TO THIS ACCOUNT YET.</p>:accountOrders.map((o)=><article key={o.order_number}><b>{o.order_number}</b><span>{o.status.toUpperCase()}</span><strong>{money(Number(o.total))}</strong><small>{new Date(o.created_at).toLocaleDateString()}</small></article>)}</section>}
          {footer()}
        </main>
      )}

      {page === 'admin' && (
        <main className="utility-page admin-page">
          <div className="page-kicker">STREET / CONTROL ROOM / 010</div>
          <div className="utility-heading"><small>PRIVATE ACCESS</small><h1>STREET<br/><span>CONTROL.</span></h1><p>Manage the catalogue and review incoming orders. Access is restricted to accounts assigned the admin role.</p></div>
          {!adminUser ? (
            <form className="admin-login" onSubmit={adminSignIn}>
              <label>ADMIN EMAIL</label><input type="email" required value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} placeholder="name@domain.com"/>
              <label>PASSWORD</label><input type="password" required value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Your password"/>
              <button className="solid" type="submit">SIGN IN ↗</button>{adminNotice&&<p>{adminNotice}</p>}
            </form>
          ) : adminRole === 'admin' ? (
            <>
              <section className="admin-overview" aria-label="Store overview">
                <div><small>CATALOGUE</small><strong>{adminProducts.length}</strong><span>ALL PIECES</span></div>
                <div><small>LIVE</small><strong>{adminProducts.filter((p) => p.is_active).length}</strong><span>VISIBLE PRODUCTS</span></div>
                <div><small>ORDERS</small><strong>{adminOrders.length}</strong><span>RECENT RECORDS</span></div>
                <div><small>TO PROCESS</small><strong>{adminOrders.filter((o) => ['pending','confirmed','processing','shipped'].includes(o.status)).length}</strong><span>OPEN ORDERS</span></div>
                <div><small>CUSTOMERS</small><strong>{adminCustomers.length}</strong><span>REGISTERED ACCOUNTS</span></div>
              </section>
              <form className="admin-create-product" onSubmit={createAdminProduct}>
                <div className="admin-section-title"><h2>ADD A NEW PIECE</h2><span>CATALOGUE ENTRY</span></div>
                <input required value={newProductName} onChange={(e)=>setNewProductName(e.target.value)} placeholder="PRODUCT NAME"/>
                <select value={newProductCategory} onChange={(e)=>setNewProductCategory(e.target.value as Category)}>{CATEGORIES.map((category)=><option key={category} value={category}>{category}</option>)}</select>
                <input inputMode="decimal" value={newProductPrice} onChange={(e)=>setNewProductPrice(e.target.value)} placeholder={`PRICE / EGP ${PRICE_RANGES[newProductCategory].min}–${PRICE_RANGES[newProductCategory].max}`}/>
                <button type="submit">CREATE PRODUCT ↗</button>
              </form>
              <section className="admin-products">
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
              <section className="admin-customers">
                <div className="admin-section-title"><h2>CUSTOMER DIRECTORY / {adminCustomers.length}</h2><span>REGISTERED ACCOUNTS</span></div>
                {adminCustomers.length===0?<p>NO CUSTOMER ACCOUNTS YET.</p>:adminCustomers.map((customer,i)=><article key={customer.email ?? i}><b>{customer.full_name || 'STREET CUSTOMER'}</b><span>{customer.email}</span><small>{new Date(customer.created_at).toLocaleDateString()}</small></article>)}
              </section>
              <section className="admin-orders">
                <div><h2>RECENT ORDERS</h2><span>{adminOrders.length} RECORDS</span></div>
                {adminOrders.length===0?<p>NO ORDERS HAVE BEEN PLACED YET.</p>:adminOrders.map((o)=><article key={o.order_number}>
                  <b>{o.order_number}</b><span>{o.customer_name}</span>
                  <select value={o.status} onChange={(e)=>void updateAdminOrder(o.order_number,e.target.value)}>
                    <option value="pending">PENDING</option><option value="confirmed">CONFIRMED</option><option value="processing">PROCESSING</option><option value="shipped">SHIPPED</option><option value="delivered">DELIVERED</option><option value="cancelled">CANCELLED</option>
                  </select>
                  <strong>{money(Number(o.total))}</strong>
                </article>)}
              </section>
            </>
          ) : (
            <div className="admin-message">{adminNotice||'THIS ACCOUNT DOES NOT HAVE ADMIN PERMISSIONS.'}<button onClick={async()=>{await supabase.auth.signOut();setAdminUser(null);setAdminRole(null);setAdminNotice('SIGNED OUT.')}}>SIGN OUT</button></div>
          )}
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
              <div className="quick-view-sizes">{quickView.sizes.map((size) => <button type="button" key={size} className={quickViewSize === size ? 'on' : ''} onClick={() => setQuickViewSize(size)}>{size}</button>)}</div>
              <button className="quick-view-add" type="button" disabled={quickView.soldOut || !quickViewSize} onClick={() => { add(quickView, quickViewSize); setQuickView(null) }}>{quickView.soldOut ? 'SOLD OUT' : 'ADD TO BAG'} <span>{money(quickView.price)}</span></button>
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
                  <button onClick={() => setCart((c) => c.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x)))}>+</button>
                  <button className="trash" onClick={() => setCart((c) => c.filter((_, k) => k !== i))}>🗑</button>
                </div>
              </div>
              <span>{money(it.product.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="d-foot">
          <div className="sub"><span>SUBTOTAL</span><b>{money(subtotal)}</b></div>
          <small>CHECKOUT IS NOT ACTIVE YET. PAYMENT AND SHIPPING MUST BE CONFIGURED BEFORE TAKING ORDERS.</small>
          <button className="solid" onClick={() => go('checkout')}>REVIEW CHECKOUT ↗</button>
          <button className="outline" onClick={() => setCartOpen(false)}>CONTINUE SHOPPING</button>
          <Pay />
        </div>
      </aside>

      {/* music widget */}
      {page !== 'intro' && (
        <div className={`player ${collapsed ? 'min' : ''}`}>
          <audio ref={audio} src={ASSETS.music || undefined} loop />
          <Img className="cover" src={ASSETS.musicCover} />
          <div className="meta"><b>{TRACK.title}</b><small>{TRACK.artist}</small></div>
          <button onClick={() => setPlaying(!playing)} aria-label="Play">{playing ? '❚❚' : '▶'}</button>
          <button onClick={() => setMuted(!muted)} aria-label="Mute">{muted ? '🔇' : '🔈'}</button>
          <button onClick={() => setCollapsed(!collapsed)} aria-label="Collapse">‹</button>
        </div>
      )}

    </div>
  )
}
