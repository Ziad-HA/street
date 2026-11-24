import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Logo3D } from './Logo3D'
import type { Pose } from './Logo3D'
import { ANNOUNCEMENTS, ASSETS, BRAND, TRACK } from './config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from './mark'
import { CATEGORIES, OUTFIT_IDS, PRODUCTS, SIZES } from './data'
import type { Category, Product } from './data'
import './App.css'

type Page = 'intro' | 'hero' | 'store' | 'collection' | 'product' | 'about' | 'journal' | 'contact' | 'wishlist' | 'track'

interface CartItem {
  product: Product
  size: string
  qty: number
}

const NAV: { label: string; page: Page }[] = [
  { label: 'HOME', page: 'hero' },
  { label: 'SHOP', page: 'store' },
  { label: 'COLLECTIONS', page: 'collection' },
  { label: 'JOURNAL', page: 'journal' },
  { label: 'ABOUT', page: 'about' },
  { label: 'CONTACT', page: 'contact' },
  { label: 'TRACK ORDER', page: 'track' },
]

const POSES: Pose[] = [
  { rx: 0, ry: 0, rz: 0, s: 1.15, x: 0, y: 0.1 },
  { rx: 0.2, ry: -0.9, rz: 0.15, s: 1.3, x: 0.6, y: 0.3 },
  { rx: 0.9, ry: 0.8, rz: 0.3, s: 1.0, x: -0.4, y: -0.2 },
  { rx: 0.1, ry: 1.5, rz: -0.1, s: 0.9, x: 0, y: 0 },
]
const SCENE_BG = [
  'linear-gradient(#a9c8e8 0%, #d7e6f0 45%, #5e8f3d 46%, #3f7a26 100%)',
  'linear-gradient(#7fb0e0 0%, #cfe0ee 48%, #5a8c3a 49%, #3a7022 100%)',
  'linear-gradient(#9dbfe0 0%, #dbe8ef 40%, #5f9441 41%, #447c2a 100%)',
  'linear-gradient(#6f7f97 0%, #8d9bb0 48%, #3d4658 49%, #2a3040 100%)',
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
  const [page, setPage] = useState<Page>('intro')
  const [veil, setVeil] = useState(false)
  const [scene, setScene] = useState(0)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => readStored<CartItem[]>('street-cart-v2', []))
  const [wish, setWish] = useState<string[]>(() => readStored<string[]>('street-wishlist-v2', []))
  const [category, setCategory] = useState<Category>('ZIP-UPS')
  const [sizeFilter, setSizeFilter] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name'>('featured')
  const [recentIds, setRecentIds] = useState<string[]>(() => readStored<string[]>('street-recently-viewed-v2', []))
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [active, setActive] = useState<Product>(PRODUCTS[0] ?? EMPTY_PRODUCT)
  const [ann, setAnn] = useState(0)
  const [hoverCat, setHoverCat] = useState<Category>('ACCESSORIES')
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
    setVeil(true)
    setTimeout(() => {
      setPage(p)
      window.scrollTo(0, 0)
      setTimeout(() => {
        if (pending.current) document.getElementById(pending.current)?.scrollIntoView({ behavior: 'smooth' })
        setVeil(false)
      }, 120)
    }, 650)
  }

  const openProduct = (p: Product) => {
    setRecentIds((ids) => [p.id, ...ids.filter((id) => id !== p.id)].slice(0, 8))
    setActive(p)
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
    if (p.soldOut) return
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
  const byCat = (c: Category) => PRODUCTS.filter((p) => p.category === c)
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
        <div className="hdr-logo" onClick={() => go('hero')}>
          <Logo3D pose={{ rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0 }} scrollSpin fov={30} />
        </div>
        <nav>
          {NAV.map((n) => (
            <a
              key={n.label}
              className={(n.label === 'HOME' && page === 'store') || (n.label === 'ABOUT US' && page === 'about') ? 'cur' : ''}
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
      <div className="giant">{BRAND}</div>
    </footer>
  )

  const filtered = PRODUCTS.filter((p) => p.category === category && (!inStock || !p.soldOut) && (!sizeFilter || p.sizes.includes(sizeFilter))).sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'name' ? a.name.localeCompare(b.name) : 0)
  const recentlyViewed = recentIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))

  const outfit = OUTFIT_IDS.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean)

  return (
    <div className={`app page-${page}`}>
      <div className="cursor" ref={cursor} />

      {page === 'intro' && (
        <div className="intro"><Logo className="intro-logo" /></div>
      )}

      {page === 'hero' && (
        <section className="hero" style={{ background: ASSETS.scenes[scene] ? undefined : SCENE_BG[scene] }}>
          {ASSETS.scenes[scene] &&
            (/\.(mp4|webm)$/i.test(ASSETS.scenes[scene]) ? (
              <video className="hero-bg" src={ASSETS.scenes[scene]} autoPlay loop muted playsInline />
            ) : (
              <Img className="hero-bg" src={ASSETS.scenes[scene]} />
            ))}
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
          <Logo3D className="hero-3d" pose={POSES[scene]} pointer spin={scene === 3 ? 0.4 : 0} />
          <button className="enter" onClick={() => go('store')}>ENTER STORE</button>
        </section>
      )}

      {page !== 'intro' && page !== 'hero' && header()}

      {page === 'store' && (
        <main className="store">
          <section className="store-hero">
            {/\.(mp4|webm)$/i.test(ASSETS.storeHero) ? (
              <video className="sh-bg" src={ASSETS.storeHero} autoPlay loop muted playsInline />
            ) : (
              <Img className="sh-bg" src={ASSETS.storeHero} />
            )}
            <div className="sh-txt">
              <small>NEW SEASON</small>
              <h1>THE LATEST DROP</h1>
              <div className="sh-btns">
                <button className="solid" onClick={() => openCollection('ZIP-UPS')}>SHOP NOW</button>
                <button className="outline" onClick={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })}>COLLECTIONS</button>
              </div>
            </div>
            <span className="sh-scroll">SCROLL</span>
          </section>
          {PRODUCTS.length === 0 ? <div className="catalog-empty"><h2>THE FIRST DROP IS ON ITS WAY.</h2><p>STREET's product catalogue is being prepared. Check back soon.</p></div> : <>{rowOf('zip', 'ZIP HOODIES', byCat('ZIP-UPS'))}{rowOf('acc', 'ACCESSORIES', byCat('ACCESSORIES').slice(0, 4))}</>}
          {recentlyViewed.length > 0 && rowOf('recent', 'RECENTLY VIEWED', recentlyViewed)}

          <section className="outfit">
            <div className="outfit-head">
              <h2>BUILD YOUR OUTFIT</h2>
              <p>Create your look. Choose your pieces and build the complete fit.</p>
            </div>
            <div className="outfit-body">
              <div className="outfit-imgs">
                {outfit.map((p) => (
                  <div key={p.id}><Img src={p.images[0]} /><h4>{p.name}</h4><span>{money(p.price)}</span></div>
                ))}
              </div>
              <aside>
                {outfit.map((p) => (
                  <div className="o-line" key={p.id}>
                    <Img src={p.images[0]} className="o-th" />
                    <b>{p.name}</b><em>{p.sizes[0]}</em><span>{money(p.price)}</span>
                  </div>
                ))}
                <div className="o-total"><span>TOTAL</span><b>{money(outfit.reduce((n, p) => n + p.price, 0))}</b></div>
                <button className="solid" onClick={() => outfit.forEach((p) => add(p, p.sizes[0]))}>ADD OUTFIT TO BAG</button>
              </aside>
            </div>
          </section>

          <section id="collections" className="collections">
            <small>COLLECTIONS</small>
            <div className="col-body">
              <ul>
                {CATEGORIES.map((c, i) => (
                  <li key={c} className={hoverCat === c ? 'on' : ''} onMouseEnter={() => setHoverCat(c)} onClick={() => openCollection(c)}>
                    <sup>{String(i + 1).padStart(2, '0')}</sup>{c}
                  </li>
                ))}
              </ul>
              <Img className="col-img" src={byCat(hoverCat)[0]?.images[0]} />
            </div>
          </section>

          <section id="lookbook" className="lookbook">
            <div className="look-scroll" ref={(el) => { scrollRow.current.look = el }} onScroll={() => onRow('look')}>
              {[0, 1, 2, 3, 4, 5].map((i) => <Img key={i} className="look-img" />)}
            </div>
            <div className="progress"><b style={{ width: `${30 + (progress.look ?? 0) * 70}%` }} /></div>
          </section>

          {footer()}
        </main>
      )}

      {page === 'collection' && (
        <main className="collection">
          <h1>{category}</h1>
          <small>{filtered.length} PRODUCTS</small>
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
                <button className="solid" disabled={active.soldOut} onClick={() => add(active, sizeSel, qty)}>
                  {Icon.bag} {active.soldOut ? 'SOLD OUT' : `ADD TO CART ${money(active.price)}`}
                </button>
                <button className={`heart-sq ${wish.includes(active.id) ? 'on' : ''}`} onClick={() => toggleWish(active.id)}>♥</button>
              </div>
              <button className="outline" disabled={active.soldOut} onClick={() => { add(active, sizeSel, qty) }}>BUY IT NOW</button>
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

      {page === 'about' && (
        <main className="about">
          <Img className="about-img" src={ASSETS.about} />
          <div className="about-txt">
            <small>OUR STORY</small>
            <h1>BUILT FOR THOSE WHO MOVE DIFFERENTLY.</h1>
            <p>STREET is an independent space for considered everyday pieces. Our story, materials and production details will be published here as the brand information is confirmed.</p>
            <div className="about-meta"><div><small>OUR FOCUS</small><b>EVERYDAY WEAR</b></div><div><small>OUR APPROACH</small><b>CONSIDERED DESIGN</b></div></div>
            <em>More about STREET coming soon.</em>
          </div>
        </main>
      )}

      {page === 'journal' && (
        <main className="journal-page">
          <div className="page-kicker">STREET / JOURNAL / 001</div>
          <section className="journal-intro">
            <small>FIELD NOTES · CULTURE · PEOPLE</small>
            <h1>MORE THAN<br />WHAT YOU WEAR.</h1>
            <p>A closer look at the ideas, places and people shaping the STREET point of view.</p>
          </section>
          <section className="journal-feature">
            <div className="journal-feature-image"><span>ISSUE 001</span></div>
            <div className="journal-feature-copy"><small>THE STREET UNIFORM · 06 MIN READ</small><h2>EVERYDAY<br />IS THE STATEMENT.</h2><p>Personal style is built in the details. The pieces you reach for, the places you move through, and the people you meet along the way.</p><button className="text-link" onClick={() => go('store')}>EXPLORE THE COLLECTION <b>↗</b></button></div>
          </section>
          <section className="journal-grid">
            <article><div className="journal-tile tile-one"><span>01 / FORM</span></div><small>DESIGN NOTES</small><h3>FUNCTION MEETS FORM.</h3><p>Utility, proportion and the pieces that earn a place in your rotation.</p></article>
            <article><div className="journal-tile tile-two"><span>02 / MOVEMENT</span></div><small>THE CITY GUIDE</small><h3>MADE TO MOVE.</h3><p>Inspired by the rhythm of the city and the energy found between destinations.</p></article>
            <article><div className="journal-tile tile-three"><span>03 / COMMUNITY</span></div><small>PEOPLE & CULTURE</small><h3>WORN YOUR WAY.</h3><p>There is no uniform way to be yourself. Make the pieces your own.</p></article>
          </section>
          
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

      <div className={`veil ${veil ? 'on' : ''}`}><Logo className="intro-logo" /></div>
    </div>
  )
}
