import { Fragment, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ANNOUNCEMENTS, ASSETS } from './config'
import { CATEGORIES, PRODUCTS } from './data'
import type { Category, Product } from './data'
import './App.css'
import { supabase, supabasePublic } from './lib/supabase'
import { LEGAL_PAGES, NAV } from './types'
import type { CartItem, Page } from './types'
import {
  EMPTY_PRODUCT,
  categoryLabel,
  defaultPriceFor,
  money,
  readStored,
} from './utils/format'
import { pathForPage, routeFromLocation } from './utils/routing'
import { Img, LazyLogo3D, Logo, Pay, RotatingProductImage } from './components/Shared'
import { Icon } from './components/icons'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LegalPages = lazy(() => import('./pages/LegalPages'))

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
  const [sizeSel, setSizeSel] = useState('XS')
  const [qty, setQty] = useState(1)
  const [ann, setAnn] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [dark, setDark] = useState(false)
  const clickAudio = useRef<AudioContext | null>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const pending = useRef<string | undefined>(undefined)
  const initialRouteRef = useRef(initialRoute)

  useEffect(() => {
    if (!quickView) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setQuickView(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [quickView])

  useEffect(() => { localStorage.setItem('street-cart-v2', JSON.stringify(cart)) }, [cart])
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
      const initRoute = initialRouteRef.current
      const matchedInitialProduct = initRoute.product ? next.find((product) => product.id === initRoute.product?.id) : undefined
      setActive((current) => next.find((product) => product.id === current.id) ?? next[0] ?? current)
      if (matchedInitialProduct) {
        setActive(matchedInitialProduct)
        setCategory(matchedInitialProduct.category)
        setSizeSel(matchedInitialProduct.sizes[0] ?? '')
        setQty(1)
      }
      if (initRoute.page === 'product' && initRoute.product && !next.some((product) => product.id === initRoute.product?.id)) {
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
      intro: 'STREET',
      hero: 'STREET',
      store: 'Shop - STREET',
      collections: 'Collections - STREET',
      collection: `${category} - STREET`,
      product: `${active.name} - STREET`,
      studio: 'Studio - STREET',
      contact: 'Contact - STREET',
      help: 'Help & FAQs - STREET',
      wishlist: 'Wishlist - STREET',
      'purchase-terms': 'Terms of Purchase - STREET',
      'style-terms': 'Style Terms - STREET',
      privacy: 'Privacy Policy - STREET',
      cookies: 'Cookies Policy - STREET',
      'ai-terms': 'Use of AI - STREET',
      sitemap: 'Sitemap - STREET',
      'cookie-settings': 'Cookie Settings - STREET',
      'market-language': 'Market & Language - STREET',
      track: 'Order Tracking - STREET',
      'new-arrivals': 'New Arrivals - STREET',
      'best-sellers': 'Best Sellers - STREET',
      lookbook: 'Lookbook - STREET',
      'build-outfit': 'Build Your Outfit - STREET',
      'size-guide': 'Size Guide - STREET',
      checkout: 'Checkout - STREET',
      account: 'Account - STREET',
      admin: 'Admin - STREET',
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

  const [galleryPaused, setGalleryPaused] = useState(false)
  const [openMaterials, setOpenMaterials] = useState(false)
  const [openDelivery, setOpenDelivery] = useState(false)
  const [trackCode, setTrackCode] = useState('')
  const [trackNotice, setTrackNotice] = useState('')
  const [trackResult, setTrackResult] = useState<{order_number:string;status:string;created_at:string;total:number}|null>(null)
  const [outfitBottom, setOutfitBottom] = useState(catalogProducts.find((p) => p.category === 'PANTS')?.id ?? '')
  const [outfitTop, setOutfitTop] = useState(catalogProducts.find((p) => p.category === 'HOODIES')?.id ?? '')

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
        {rotateImages ? (
          <RotatingProductImage images={p.images} />
        ) : (
          <>
            <Img src={p.images[0]} className="card-image-primary" alt={p.name} />
            {p.images[1] && <Img src={p.images[1]} className="card-image-hover" alt={p.name} />}
          </>
        )}
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
          <LazyLogo3D pose={{ rx: 0.08, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0.95} fov={30} />
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
    <footer id="footer" className="street-footer">
      <div className="street-footer-main">
        <section className="street-footer-column">
          <h3>CAN WE HELP YOU?</h3>
          <p className="street-footer-help-copy">Need help with an order or have a question? Our team is here to help.</p>
          <button onClick={() => go('contact')}>CONTACT</button>
          <button onClick={() => go('help')}>HELP</button>
        </section>
        <section className="street-footer-column">
          <h3>WE ARE STREET</h3>
          <button onClick={() => go('studio')}>ABOUT STREET</button>
          <button onClick={() => go('lookbook')}>OUR COLLECTIONS</button>
        </section>
        <section className="street-footer-column street-footer-interested">
          <h3>YOU MIGHT BE INTERESTED IN</h3>
          <button onClick={() => go('new-arrivals')}>NEW ARRIVALS</button>
          <button onClick={() => go('best-sellers')}>BEST SELLERS</button>
          <button onClick={() => go('size-guide')}>SIZE GUIDE</button>
          <button onClick={() => go('track')}>ORDER TRACKING</button>
          <button onClick={() => go('account')}>MY ACCOUNT</button>
          <button onClick={() => go('checkout')}>MY BAG</button>
        </section>
      </div>
      <div className="street-footer-social">
        <span>FOLLOW STREET</span>
        <small>SOCIAL LINKS WILL BE ADDED SOON</small>
      </div>
      <div className="foot-mid">
        <span>STREET / EGYPT</span>
        <div><span className="secure">Order and payment details will be confirmed at checkout.</span><Pay /></div>
      </div>
      <div className="footer-mark"><Logo className="footer-logo" /></div>
      <div className="footer-legal-bottom">
        <nav className="street-legal-nav" aria-label="Legal information and settings">
          <span>LEGAL & INFORMATION</span>
          <button onClick={() => go('purchase-terms')}>TERMS AND CONDITIONS OF PURCHASE</button>
          <button onClick={() => go('privacy')}>PRIVACY POLICY</button>
          <button onClick={() => go('cookies')}>COOKIES POLICY</button>
          <button onClick={() => go('cookie-settings')}>COOKIE SETTINGS</button>
          <button onClick={() => go('sitemap')}>SITEMAP</button>
          <button onClick={() => go('ai-terms')}>USE OF AI</button>
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

  const outfitPriority: Category[] = active.category === 'PANTS'
    ? ['JACKETS', 'T-SHIRTS', 'HOODIES', 'CAPS']
    : active.category === 'JACKETS'
      ? ['T-SHIRTS', 'PANTS', 'HOODIES', 'CAPS']
      : active.category === 'T-SHIRTS'
        ? ['JACKETS', 'PANTS', 'HOODIES', 'CAPS']
        : active.category === 'HOODIES'
          ? ['PANTS', 'JACKETS', 'T-SHIRTS', 'CAPS']
          : ['PANTS', 'JACKETS', 'HOODIES', 'T-SHIRTS']
  const outfitOrder = [
    ...outfitPriority,
    ...(['PANTS', 'JACKETS', 'HOODIES', 'T-SHIRTS', 'CAPS'] as Category[])
      .filter((category) => category !== active.category && !outfitPriority.includes(category))
  ]
  // Pick one product per category so the outfit suggestions always feel varied.
  const outfitMarqueeProducts = outfitOrder.flatMap((category) => {
    const product = catalogProducts.find((p) => p.category === category && p.id !== active.id)
    return product ? [product] : []
  }).slice(0, 4)


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
            <LazyLogo3D pose={{ rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0.85} fov={30} />
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
            <div className="section-head"><small>01 / FIND YOUR CATEGORY</small><span>CHOOSE A CATEGORY ↗</span></div>
            <div className="shop-category-list">
              {CATEGORIES.map((c,i) => (
                <button className="shop-category-card" key={c} onClick={() => openCollection(c as Category)}>
                  <sup>{String(i+1).padStart(2,'0')}</sup>
                  <strong>{categoryLabel(c as Category)}</strong>
                  <span>EXPLORE <b>↗</b></span>
                </button>
              ))}
            </div>
          </section>
          <section className="shop-all">
            <div className="section-head"><small>02 / THE FULL ROTATION</small><span>{catalogProducts.length} PRODUCTS / BY CATEGORY</span></div>
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
          {outfitMarqueeProducts.length > 0 && (
            <section className="complete-outfit">
              <div className="complete-outfit-head">
                <div><small>STREET / STYLE THE PIECE</small><h2>COMPLETE YOUR OUTFIT<span>.</span></h2></div>
                <p>MAKE THE LOOK YOURS — EXPLORE PIECES THAT WORK TOGETHER.</p>
              </div>
              <div className="complete-outfit-grid">
                {outfitMarqueeProducts.slice(0, 4).map((p, i) => (
                  <Fragment key={`outfit-${p.id}`}>{card(p, i + 1, 4, false, false)}</Fragment>
                ))}
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
            <div className="studio-visual"><div className="studio-orbit orbit-one" /><div className="studio-orbit orbit-two" /><LazyLogo3D className="studio-logo-3d" pose={{rx:.2,ry:.3,rz:0,s:1.15,x:0,y:0}} spin={.15} /><span>STREET / CREATIVE SYSTEM 001</span></div>
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
        <Suspense fallback={<main id="main-content" className="utility-page"><p>LOADING CHECKOUT…</p></main>}>
          <CheckoutPage
            cart={cart}
            setCart={setCart}
            setCatalogProducts={setCatalogProducts}
            go={go}
            footer={footer()}
          />
        </Suspense>
      )}

      {page === 'account' && (
        <Suspense fallback={<main id="main-content" className="utility-page"><p>LOADING ACCOUNT…</p></main>}>
          <AccountPage setWish={setWish} footer={footer()} />
        </Suspense>
      )}

      {page === 'admin' && (
        <Suspense fallback={<main id="main-content" className="utility-page"><p>LOADING ADMIN…</p></main>}>
          <AdminPage
            active={active}
            setActive={setActive}
            setCatalogProducts={setCatalogProducts}
            setCart={setCart}
            onProductHidden={() => {
              setPage('store')
              window.history.replaceState({}, '', '/shop')
            }}
            footer={footer()}
          />
        </Suspense>
      )}

      {LEGAL_PAGES.includes(page) && (
        <Suspense fallback={<main id="main-content" className="utility-page"><p>LOADING…</p></main>}>
          <LegalPages page={page} footer={footer()} />
        </Suspense>
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
