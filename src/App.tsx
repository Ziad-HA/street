import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Logo3D } from './Logo3D'
import type { Pose } from './Logo3D'
import { ANNOUNCEMENTS, ASSETS, BRAND, TRACK } from './config'
import { DOTS, MARK_H, MARK_STROKE, MARK_W, STROKES } from './mark'
import { CATEGORIES, OUTFIT_IDS, PRODUCTS, SIZES } from './data'
import type { Category, Product } from './data'
import './App.css'

type Page = 'intro' | 'hero' | 'store' | 'collection' | 'product' | 'about'

interface CartItem {
  product: Product
  size: string
  qty: number
}

const NAV: { label: string; page: Page; anchor?: string }[] = [
  { label: 'HOME', page: 'hero' },
  { label: 'SHOP', page: 'store' },
  { label: 'CONTACT', page: 'store', anchor: 'footer' },
  { label: 'LOOKBOOK', page: 'store', anchor: 'lookbook' },
  { label: 'TIMELINE', page: 'store', anchor: 'collections' },
  { label: 'ABOUT US', page: 'about' },
  { label: 'TRACK ORDER', page: 'store', anchor: 'footer' },
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

const money = (n: number) => `$${n.toFixed(2)}`

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

const Pay = () => (
  <div className="pay">
    {['VISA', 'MC', 'AMEX', 'P', 'D', 'DISC'].map((p) => (
      <span key={p}>{p}</span>
    ))}
  </div>
)

const Socials = () => (
  <div className="socials">
    {['IG', 'TT', 'X', 'DC', 'WC', 'WB', '✉'].map((s) => (
      <span key={s}>{s}</span>
    ))}
  </div>
)

export default function App() {
  const [page, setPage] = useState<Page>('intro')
  const [veil, setVeil] = useState(false)
  const [scene, setScene] = useState(0)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wish, setWish] = useState<string[]>(['snakeskin-zip', 'plaid-zip', 'canvas-backpack'])
  const [category, setCategory] = useState<Category>('ZIP-UPS')
  const [sizeFilter, setSizeFilter] = useState<string | null>(null)
  const [inStock, setInStock] = useState(false)
  const [active, setActive] = useState<Product>(PRODUCTS[0])
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
              onClick={() => (n.page === 'hero' ? go('hero') : n.page === 'about' ? go('about') : n.anchor ? (page === 'store' ? document.getElementById(n.anchor)?.scrollIntoView({ behavior: 'smooth' }) : go('store', n.anchor)) : go('store'))}
            >
              {n.label}{n.label === 'SHOP' && <em> ⌄</em>}
            </a>
          ))}
        </nav>
        <div className="icons">
          <button onClick={() => setSearch(true)}>{Icon.search}</button>
          <button>{Icon.user}</button>
          <button>{Icon.heart}<span>({wish.length})</span></button>
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
          ['FREE SHIPPING', 'On orders over $150'],
          ['EASY RETURNS', '14-day hassle-free returns'],
          ['SECURE PAYMENT', 'Safe & encrypted checkout'],
          ['WORLDWIDE SHIPPING', 'We ship worldwide'],
        ].map(([a, b]) => (
          <div key={a}><i />{<div><b>{a}</b><small>{b}</small></div>}</div>
        ))}
      </div>
      <Socials />
      <div className="foot-mid">
        <span>Inspired By {BRAND}</span>
        <div><span className="secure">● Secure Checkout — We Accept</span><Pay /></div>
      </div>
      <div className="giant">{BRAND}</div>
    </footer>
  )

  const filtered = PRODUCTS.filter((p) => p.category === category && (!inStock || !p.soldOut) && (!sizeFilter || p.sizes.includes(sizeFilter)))

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
          {rowOf('zip', 'ZIP HOODIES', byCat('ZIP-UPS'))}
          {rowOf('acc', 'ACCESSORIES', byCat('ACCESSORIES').slice(0, 4))}

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
              <span>SORT BY ⌄</span>
              <label>IN STOCK <i className={`tog ${inStock ? 'on' : ''}`} onClick={() => setInStock(!inStock)}><b /></i></label>
              <span>▽ FILTER</span>
              <span className="grid2" /><span className="grid3" />
            </div>
          </div>
          <div className="grid">
            {filtered.map((p, i) => <Fragment key={p.id}>{card(p, i + 1, filtered.length)}</Fragment>)}
          </div>
          {footer()}
        </main>
      )}

      {page === 'product' && (
        <main className="pdp">
          <div className="pdp-wrap">
            <div className="thumbs">
              {active.images.map((im, i) => (
                <Img key={i} src={im} className={i === imgIdx ? 'on' : ''} style={{ cursor: 'pointer' }} />
              ))}
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
              <div className="links"><span>SIZE GUIDE ▭</span><span>⊢ FIND MY SIZE</span></div>
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
                <li><b>FREE SHIPPING</b><small>On all orders — no minimum</small></li>
                <li><b>SECURE PAYMENT</b><small>Encrypted checkout — shop with confidence</small></li>
                <li><b>EASY RETURNS</b><small>Hassle-free returns within 30 days</small></li>
                <li><b>WORLDWIDE SHIPPING</b><small>Delivered to your door, wherever you are</small></li>
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
            <p>Independent by nature. Rooted in London. Built for those who refuse to follow.</p>
            <div className="about-meta">
              <div><small>BASED IN</small><b>LONDON</b></div>
              <div><small>FOUNDED</small><b>2017</b></div>
              <div><small>PHILOSOPHY</small><b>RULES THE WORLD</b></div>
            </div>
            <em>No rules. No limits. Just culture.</em>
          </div>
        </main>
      )}

      {/* menu overlay */}
      <div className={`menu ${menu ? 'open' : ''}`}>
        <button className="x" onClick={() => setMenu(false)}>{Icon.close}</button>
        <div className="menu-in">
          <Logo className="menu-logo" />
          <small>{dateStr} · {timeStr}</small>
          <ul>
            {NAV.map((n) => <li key={n.label} onClick={() => go(n.page, n.anchor)}>{n.label}<span> →</span></li>)}
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
          <div><span>{subtotal >= 150 ? "YOU'VE UNLOCKED FREE SHIPPING!" : `ADD ${money(150 - subtotal)} FOR FREE SHIPPING`}</span><b>{Math.min(100, Math.round((subtotal / 150) * 100))}%</b></div>
          <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / 150) * 100)}%` }} /></div>
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
          <label>DISCOUNT CODE</label>
          <div className="code"><input placeholder="Enter code" /><button>APPLY</button></div>
          <label>GIFT MESSAGE</label>
          <textarea placeholder="Add a note for this order" />
          <div className="sub"><span>SUBTOTAL</span><b>{money(subtotal)}</b></div>
          <small>TAXES AND SHIPPING CALCULATED AT CHECKOUT.</small>
          <label className="terms"><input type="checkbox" /> I have read and agree to the Terms &amp; Conditions and Privacy Policy.</label>
          <button className="solid" disabled={cart.length === 0}>CHECKOUT</button>
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
