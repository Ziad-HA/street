import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Logo3D } from './Logo3D'
import { ANNOUNCEMENTS, ASSETS, BRAND, TRACK } from './config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from './mark'
import { CATEGORIES, PRODUCTS, SIZES } from './data'
import type { Category, Product } from './data'
import './App.css'

type Page = 'intro' | 'hero' | 'store' | 'collections' | 'collection' | 'product' | 'studio' | 'contact' | 'wishlist' | 'track'

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

const money = (n: number) => `${n.toFixed(2)}`

const EMPTY_PRODUCT: Product = { id: '', name: 'PRODUCT DETAILS', category: 'ZIP-UPS', price: 0, sizes: [], color: '#eeeeee', images: [], details: [] }

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

const Socials = () => (
  <div className="socials">
    {['IG', 'TT', 'X', 'DC', 'WC', 'WB', '✉'].map((s) => (
      <span key={s}>{s}</span>
    ))}
  </div>
)

function readStored<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    try { return localStorage.getItem('street-intro-seen-v1') === '1' ? 'hero' : 'intro' }
    catch { return 'intro' }
  })
  const [scene, setScene] = useState(0)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => readStored<CartItem[]>('street-cart-v2', []))
  const [wish, setWish] = useState<string[]>(() => readStored<string[]>('street-wishlist-v2', []))
  const [category, setCategory] = useState<Category>('ZIP-UPS')
  const [showAllShopProducts, setShowAllShopProducts] = useState(false)
  const [sizeFilter, setSizeFilter] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured')
  const [recentIds, setRecentIds] = useState<string[]>(() => readStored<string[]>('street-recently-viewed-v2', []))
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [active, setActive] = useState<Product>(PRODUCTS[0] ?? EMPTY_PRODUCT)
  const [ann, setAnn] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const pending = useRef<string | undefined>(undefined)

  useEffect(() => { localStorage.setItem('street-cart-v2', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('street-wishlist-v2', JSON.stringify(wish)) }, [wish])
  useEffect(() => { localStorage.setItem('street-recently-viewed-v2', JSON.stringify(recentIds)) }, [recentIds])

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
    setImgIdx(0)
    setSearch(false)
    setPage('product')
    window.scrollTo(0, 0)
  }
  const openCollection = (c: Category) => {
    setCategory(c)
    setSizeFilter(null)
    setSearch(false)
    setPage('collection')
    window.scrollTo(0, 0)
  }

  const [sizeSel, setSizeSel] = useState('XS')
  const [qty, setQty] = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const [openDetails, setOpenDetails] = useState(true)
  const [trackCode, setTrackCode] = useState('')
  const [trackNotice, setTrackNotice] = useState('')

  const add = (p: Product, size: string, q = 1) => {
    if (p.soldOut || p.isDemo) return
    setCart((c) => {
      const i = c.findIndex((x) => x.product.id === p.id && x.size === size)
      if (i > -1) return c.map((x, k) => (k === i ? { ...x, qty: x.qty + q } : x))
      return [...c, { product: p, size, qty: q }]
    })
    setCartOpen(true)
  }
  const toggleWish = (id: string) =>
    setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const subtotal = cart.reduce((n, i) => n + i.product.price * i.qty, 0)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? PRODUCTS.filter((p) => (p.name + p.category).toLowerCase().includes(q)) : PRODUCTS.filter((p) => p.category === 'HEADWEAR' || p.id === 'crew-sock').slice(0, 4)
  }, [query])

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

  const card = (p: Product, index?: number, total?: number, row?: boolean) => (
    <article className={`card ${p.soldOut ? 'sold' : ''}`}>
      <button className={`heart ${wish.includes(p.id) ? 'on' : ''}`} onClick={() => toggleWish(p.id)} aria-label="Wishlist">
        {Icon.heart}
      </button>
      <div className="card-img" onClick={() => openProduct(p)}>
        <Img src={p.images[0]} />
      </div>
      <div className="dots"><i className="on" /><i /></div>
      {index !== undefined && <div className="idx">{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>}
      {p.isDemo && <div className="demo-flag">DEMO · NOT FOR SALE</div>}
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
      <button className="mini-bag" disabled={p.soldOut || p.isDemo} onClick={() => add(p, p.sizes[0])} aria-label="Add to bag">
        {Icon.bag}
      </button>
    </article>
  )

  const rowOf = (id: string, title: string, items: Product[]) => (
    <section className="row">
      <h2 className="row-title">{title}</h2>
      <button className="view-all" onClick={() => openCollection(items[0]?.category ?? 'ZIP-UPS')}>VIEW ALL</button>
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
          <Logo3D pose={{ rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} spin={0.85} fov={30} />
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
      <Socials />
      <div className="foot-mid">
        <span>Inspired By {BRAND}</span>
        <div><span className="secure">Order and payment details will be confirmed at checkout.</span><Pay /></div>
      </div>
      <div className="footer-mark"><Logo className="footer-logo" /></div>
    </footer>
  )

  const filtered = PRODUCTS.filter((p) => p.category === category && (!inStock || !p.soldOut) && (!sizeFilter || p.sizes.includes(sizeFilter))).sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'name' ? a.name.localeCompare(b.name) : 0)
  const recentlyViewed = recentIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
  const orderedShopProducts = [...PRODUCTS].sort((a,b) => {
    const order = ['TEES','HOODIES','ZIP-UPS','BOTTOMS','DENIM','OUTERWEAR','CREWS','KNITS','HEADWEAR','ACCESSORIES']
    return order.indexOf(a.category) - order.indexOf(b.category)
  })
  const visibleShopProducts = showAllShopProducts ? orderedShopProducts : orderedShopProducts.slice(0, 12)


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
          <div className="hero-center-stage">
            <video className="hero-center-video" src={ASSETS.introVideo} autoPlay muted loop playsInline preload="auto" />
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
            <div className="shop-stats"><span>01 — 10 / CATEGORIES</span><span>030 / DEMO ITEMS</span><span>SCROLL TO EXPLORE ↓</span></div>
          </section>
          <div className="demo-notice"><b>CATALOGUE PREVIEW</b><span>All listings, photos and prices are temporary visual examples — not real stock and not available to purchase.</span></div>
          <section className="shop-categories">
            <div className="section-head"><small>01 / FIND YOUR CATEGORY</small><span>SELECT A DEPARTMENT ↗</span></div>
            <div className="shop-category-list">
              {['TEES','HOODIES','ZIP-UPS','BOTTOMS','DENIM','OUTERWEAR','CREWS','KNITS','HEADWEAR','ACCESSORIES'].map((c,i) => (
                <button key={c} onClick={() => openCollection(c as Category)}><sup>{String(i+1).padStart(2,'0')}</sup>{c}<span>↗</span></button>
              ))}
            </div>
          </section>
          <section className="shop-all">
            <div className="section-head"><small>02 / THE FULL ROTATION</small><span>{PRODUCTS.length} ITEMS / SORTED BY DEPARTMENT</span></div>
            <div className="shop-grid">
              {visibleShopProducts.map((p,i) => <Fragment key={p.id}>{card(p,i+1,PRODUCTS.length)}</Fragment>)}
            </div>
            <button className="shop-expand" onClick={() => setShowAllShopProducts((v) => !v)}>{showAllShopProducts ? 'SHOW LESS ↑' : `VIEW ALL ${PRODUCTS.length} PRODUCTS ↓`}</button>
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
              {no:'01',name:'THE CORE',desc:'Everyday foundations. Clean shapes, easy rotation.',cat:'TEES',meta:'TEES / CREWS'},
              {no:'02',name:'AFTER HOURS',desc:'Layer up. Heavier silhouettes for a different pace.',cat:'HOODIES',meta:'HOODIES / ZIP-UPS'},
              {no:'03',name:'UTILITY MODE',desc:'Functional shapes with a utilitarian edge.',cat:'BOTTOMS',meta:'BOTTOMS / OUTERWEAR'},
              {no:'04',name:'DENIM STUDY',desc:'The everyday essential, reworked through proportion.',cat:'DENIM',meta:'DENIM'},
              {no:'05',name:'OBJECTS',desc:'The finishing details that complete the rotation.',cat:'HEADWEAR',meta:'HEADWEAR / ACCESSORIES'},
              {no:'06',name:'TEXTURE LAB',desc:'A closer look at texture, structure and material.',cat:'KNITS',meta:'KNITS'},
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
          <h1>{category}</h1>
          <small>{filtered.length} PRODUCTS</small>
          <div className="demo-notice"><b>PREVIEW ONLY</b><span>Demo products and illustrative prices — not available for purchase.</span></div>
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button key={c} className={c === category ? 'on' : ''} onClick={() => { setCategory(c); setSizeFilter(null) }}>{c}</button>
            ))}
          </div>
          <div className="toolbar">
            <div className="sz"><span>SIZE</span>{SIZES.map((s) => (
              <button key={s} className={sizeFilter === s ? 'on' : ''} onClick={() => setSizeFilter(sizeFilter === s ? null : s)}>{s}</button>
            ))}</div>
            <div className="tools">
              <label className="sort-label">SORT BY <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>
              <label>IN STOCK <i className={`tog ${inStock ? 'on' : ''}`} onClick={() => setInStock(!inStock)}><b /></i></label>
              <span>▽ FILTER</span>
              <span className="grid2" /><span className="grid3" />
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
            <div className="thumbs">
              {active.images.map((im, i) => <button key={i} type="button" className={i === imgIdx ? 'thumb-button on' : 'thumb-button'} onClick={() => setImgIdx(i)} aria-label={`Show product image ${i + 1}`}><Img src={im} /></button>)}
            </div>
            <div className="gallery">
              <button className="arr l" onClick={() => setImgIdx((i) => (i - 1 + active.images.length) % active.images.length)}>‹</button>
              <Img src={active.images[imgIdx]} className="g-img" />
              <button className="arr r" onClick={() => setImgIdx((i) => (i + 1) % active.images.length)}>›</button>
            </div>
            <div className="info">
              <small>SHOP / {category} / {active.name}</small>
              {active.isDemo && <div className="demo-pdp-label">CATALOGUE PREVIEW · NOT FOR SALE</div>}
              <h1>{active.name}</h1>
              <div className="p-price">{money(active.price)}</div>
              <label>SIZE</label>
              <div className="sizes">
                {active.sizes.map((s) => <button key={s} className={sizeSel === s ? 'on' : ''} onClick={() => setSizeSel(s)}>{s}</button>)}
              </div>
              <div className="swatch" style={{ background: active.color }} />
              <label>FABRIC</label>
              <div className="sizes"><button className="on">COTTON</button></div>
              <div className="qty-row">
                <label>QUANTITY</label>
                <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div>
              </div>
              <div className="links"><button type="button" onClick={() => setSizeGuideOpen((open) => !open)}>SIZE GUIDE {sizeGuideOpen ? '−' : '+'}</button></div>
              {sizeGuideOpen && <div className="size-guide"><b>SIZE GUIDE</b><p>Compare these with a similar item you own. Add verified garment measurements for this product before publishing.</p><div className="size-guide-table"><span>SIZE</span><span>CHEST</span><span>LENGTH</span>{active.sizes.map((size) => <Fragment key={size}><span>{size}</span><span>—</span><span>—</span></Fragment>)}</div></div>}
              <div className="buy">
                <button className="solid" disabled={active.soldOut || active.isDemo} onClick={() => add(active, sizeSel, qty)}>
                  {Icon.bag} {active.isDemo ? 'PREVIEW ONLY · NOT FOR SALE' : active.soldOut ? 'SOLD OUT' : `ADD TO CART ${money(active.price)}`}
                </button>
                <button className={`heart-sq ${wish.includes(active.id) ? 'on' : ''}`} onClick={() => toggleWish(active.id)}>♥</button>
              </div>
              <button className="outline" disabled={active.soldOut || active.isDemo} onClick={() => { add(active, sizeSel, qty) }}>BUY IT NOW</button>
              <Pay />
              <div className="prevnext">
                <span onClick={() => { const l = PRODUCTS.filter((p) => p.category === active.category); openProduct(l[(l.indexOf(active) - 1 + l.length) % l.length]) }}>‹ PREV</span>
                <span onClick={() => { const l = PRODUCTS.filter((p) => p.category === active.category); openProduct(l[(l.indexOf(active) + 1) % l.length]) }}>NEXT ›</span>
              </div>
              <ul className="perks">
                <li><b>PRODUCT INFORMATION</b><small>Review the item details and measurements before ordering.</small></li>
                <li><b>ORDER SUPPORT</b><small>Official support and delivery policies will be published here.</small></li>
              </ul>
              <button className="acc" onClick={() => setOpenDetails(!openDetails)}>PRODUCT DETAILS <span>{openDetails ? '⌃' : '⌄'}</span></button>
              {openDetails && <ul className="details">{active.details.map((d) => <li key={d}>{d}</li>)}</ul>}
            </div>
          </div>
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
          {wish.length ? <div className="grid">{PRODUCTS.filter((p) => wish.includes(p.id)).map((p, i) => <Fragment key={p.id}>{card(p, i + 1, wish.length)}</Fragment>)}</div> : <div className="wishlist-empty"><h2>NOTHING SAVED. YET.</h2><p>Save the pieces you like and they’ll be waiting here.</p><button className="solid" onClick={() => go('store')}>DISCOVER THE STORE</button></div>}
          {footer()}
        </main>
      )}

      {page === 'track' && (
        <main className="track-page">
          <div className="page-kicker">STREET / ORDER SUPPORT</div>
          <section className="track-panel">
            <small>YOUR ORDER, YOUR WAY</small><h1>TRACK<br />YOUR ORDER.</h1>
            <p>Enter the order number from your confirmation email to find your delivery details.</p>
            <form onSubmit={(e) => { e.preventDefault(); setTrackNotice(trackCode.trim() ? 'Tracking is not connected yet. Please contact our support team with your order number.' : 'Please enter your order number.'); }}>
              <label htmlFor="track-code">ORDER NUMBER</label>
              <input id="track-code" value={trackCode} onChange={(e) => { setTrackCode(e.target.value); setTrackNotice(''); }} placeholder="e.g. ST-10482" />
              <button className="solid" type="submit">FIND MY ORDER ↗</button>
              {trackNotice && <span className="track-notice">{trackNotice}</span>}
            </form>
            <span className="track-support">Tracking will be available once order management is connected.</span>
          </section>
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
          <Socials />
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
            {CATEGORIES.map((c) => <li key={c} onClick={() => openCollection(c)}>{c}<span>COLLECTION</span></li>)}
          </ul>
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
          <button className="solid" disabled>CHECKOUT COMING SOON</button>
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
