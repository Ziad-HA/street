import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

type SceneMode = 'meadow' | 'atmosphere' | 'studio';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number | null;
  fabric: string;
  sizes: string[];
  accentA: string;
  accentB: string;
  pattern: 'snakeskin' | 'plaid' | 'washed' | 'acid' | 'utility' | 'script';
  details: string;
}

interface CartItem {
  product: Product;
  size: string;
  qty: number;
}

const ANNOUNCEMENTS = [
  '10% OFF WHEN YOU JOIN THE STREET LIST — DROP 02 LIVE',
  'FREE SHIPPING ON ORDERS OVER $150 — PROCEDURAL 3D EDITION',
  'NEW ZIP HOODIES & HEAVYWEIGHT FLEECE — ZERO EXTERNAL ASSETS',
];

const CATEGORIES = [
  'ACCESSORIES',
  'BOTTOMS',
  'CREWS',
  'DENIM',
  'HEADWEAR',
  'HOODIES',
  'KNITS',
  'OUTERWEAR',
  'TEES',
  'ZIP-UPS',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

const PRODUCTS: Product[] = [
  {
    id: 'snakeskin-zip',
    code: '01 / 04',
    name: 'SNAKESKIN ZIP HOODIE',
    category: 'ZIP-UPS',
    price: 165,
    fabric: '500GSM COTTON FLEECE',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    accentA: '#2b2f36',
    accentB: '#7a828e',
    pattern: 'snakeskin',
    details: 'Boxy cropped fit, two-way brushed metal zipper, double-layered hood, procedural reptile-grain wash.',
  },
  {
    id: 'plaid-lined-zip',
    code: '02 / 04',
    name: 'PLAID LINED ZIP HOODIE',
    category: 'ZIP-UPS',
    price: 190,
    fabric: 'HEAVY COTTON + FLANNEL',
    sizes: ['S', 'M', 'L', 'XL'],
    accentA: '#1f242d',
    accentB: '#a8383b',
    pattern: 'plaid',
    details: 'Relaxed streetwear drape with thermal plaid interior lining and raw-edge hem stitching.',
  },
  {
    id: 'obsidian-washed-zip',
    code: '03 / 04',
    name: 'OBSIDIAN WASH ZIP HOODIE',
    category: 'ZIP-UPS',
    price: 175,
    fabric: '100% ORGANIC COTTON',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    accentA: '#14171c',
    accentB: '#48505e',
    pattern: 'washed',
    details: 'Sun-faded charcoal pigment treatment with dropped shoulders and heavyweight rib cuffs.',
  },
  {
    id: 'chrome-acid-zip',
    code: '04 / 04',
    name: 'CHROME ACID ZIP HOODIE',
    category: 'ZIP-UPS',
    price: null,
    fabric: '480GSM LOOPBACK FLEECE',
    sizes: ['M', 'L', 'XL'],
    accentA: '#23272f',
    accentB: '#cfd6e0',
    pattern: 'acid',
    details: 'Acid-washed slate finish with metallic STREET chest emblem and structured double hood.',
  },
  {
    id: 'tactical-utility-bag',
    code: '05 / 06',
    name: 'STREET UTILITY SLING BAG',
    category: 'ACCESSORIES',
    price: 120,
    fabric: 'BALLISTIC NYLON',
    sizes: ['ONE SIZE'],
    accentA: '#172238',
    accentB: '#6d83a8',
    pattern: 'utility',
    details: 'Modular crossbody carry with quick-release hardware and internal tech sleeve.',
  },
  {
    id: 'monogram-script-crew',
    code: '06 / 06',
    name: 'STREET SCRIPT CREWNECK',
    category: 'CREWS',
    price: 145,
    fabric: '520GSM HEAVY FLEECE',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    accentA: '#1b1d21',
    accentB: '#e5e7eb',
    pattern: 'script',
    details: 'Raised puff-print STREET lettering across the chest with structured collar.',
  },
];

function GarmentCanvas({
  pattern,
  accentA,
  accentB,
  label,
  compact = false,
}: {
  pattern: Product['pattern'];
  accentA: string;
  accentB: string;
  label: string;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Soft studio backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f5f6f8');
    bgGrad.addColorStop(1, '#e7eaef');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines for technical studio feel
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Garment silhouette (hoodie / jacket / bag)
    const cx = w / 2;
    const topY = h * 0.22;
    const bodyW = w * 0.36;
    const bodyH = h * 0.54;

    ctx.save();
    ctx.beginPath();
    if (pattern === 'utility') {
      ctx.roundRect(cx - bodyW * 0.55, topY + 28, bodyW * 1.1, bodyH * 0.72, 24);
    } else {
      // Sleeves + torso hoodie shape
      ctx.moveTo(cx - bodyW * 0.28, topY);
      ctx.lineTo(cx + bodyW * 0.28, topY);
      ctx.lineTo(cx + bodyW * 0.95, topY + 46);
      ctx.lineTo(cx + bodyW * 0.78, topY + bodyH * 0.55);
      ctx.lineTo(cx + bodyW * 0.52, topY + bodyH * 0.52);
      ctx.lineTo(cx + bodyW * 0.5, topY + bodyH);
      ctx.lineTo(cx - bodyW * 0.5, topY + bodyH);
      ctx.lineTo(cx - bodyW * 0.52, topY + bodyH * 0.52);
      ctx.lineTo(cx - bodyW * 0.78, topY + bodyH * 0.55);
      ctx.lineTo(cx - bodyW * 0.95, topY + 46);
      ctx.closePath();
    }
    ctx.clip();

    const fabricGrad = ctx.createLinearGradient(cx - bodyW, topY, cx + bodyW, topY + bodyH);
    fabricGrad.addColorStop(0, accentA);
    fabricGrad.addColorStop(0.55, accentB);
    fabricGrad.addColorStop(1, accentA);
    ctx.fillStyle = fabricGrad;
    ctx.fillRect(0, 0, w, h);

    // Procedural pattern overlays
    if (pattern === 'snakeskin') {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1.2;
      for (let y = topY; y < topY + bodyH; y += 12) {
        for (let x = cx - bodyW; x < cx + bodyW; x += 14) {
          ctx.beginPath();
          ctx.ellipse(x + ((y / 12) % 2) * 7, y, 7, 5, 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (pattern === 'plaid') {
      ctx.strokeStyle = 'rgba(255, 215, 160, 0.22)';
      ctx.lineWidth = 3;
      for (let x = cx - bodyW; x < cx + bodyW; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, topY + bodyH);
        ctx.stroke();
      }
      for (let y = topY; y < topY + bodyH; y += 22) {
        ctx.beginPath();
        ctx.moveTo(cx - bodyW, y);
        ctx.lineTo(cx + bodyW, y);
        ctx.stroke();
      }
    } else if (pattern === 'acid') {
      for (let i = 0; i < 28; i++) {
        const rx = cx - bodyW * 0.7 + ((i * 53) % (bodyW * 1.4));
        const ry = topY + ((i * 79) % bodyH);
        const rad = 10 + (i % 4) * 7;
        const g = ctx.createRadialGradient(rx, ry, 1, rx, ry, rad);
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Center zipper / seam highlight
    if (pattern !== 'utility' && pattern !== 'script') {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, topY + 14);
      ctx.lineTo(cx, topY + bodyH);
      ctx.stroke();
    }

    // Hood opening
    if (pattern !== 'utility') {
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(cx, topY + 12, bodyW * 0.22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // STREET badge on garment
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = `800 ${compact ? 11 : 14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STREET', cx, topY + bodyH * 0.56);

    ctx.restore();

    // Bottom micro-caption
    ctx.fillStyle = '#64748b';
    ctx.font = '600 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), cx, h - 12);
  }, [pattern, accentA, accentB, label, compact]);

  return (
    <canvas
      ref={canvasRef}
      width={compact ? 260 : 420}
      height={compact ? 260 : 460}
      className="garment-canvas"
    />
  );
}

export function App() {
  const [tickerIdx, setTickerIdx] = useState(0);
  const [scene, setScene] = useState<SceneMode>('meadow');
  const [activeCategory, setActiveCategory] = useState<string>('ZIP-UPS');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [pdpSize, setPdpSize] = useState<string>('L');
  const [pdpQty, setPdpQty] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(['snakeskin-zip']);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const totalCartPrice = useMemo(
    () => cart.reduce((sum, item) => sum + (item.product.price ?? 0) * item.qty, 0),
    [cart]
  );

  const addToCart = (product: Product, size = 'L', qty = 1) => {
    if (product.price === null) return;
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size
      );
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { product, size, qty }];
    });
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];
    if (inStockOnly) list = list.filter((p) => p.price !== null);
    if (selectedSizeFilter) {
      list = list.filter((p) => p.sizes.includes(selectedSizeFilter));
    }
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return list;
  }, [inStockOnly, selectedSizeFilter, sortBy]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PRODUCTS.slice(0, 4);
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const featuredSplitProduct = useMemo(() => {
    const match = PRODUCTS.find((p) => p.category === activeCategory);
    return match ?? PRODUCTS[0];
  }, [activeCategory]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: -ny * 18, y: nx * 24 });
  };

  return (
    <div className="street-app">
      {/* 1. Top Announcement Bar */}
      <div className="announcement-bar">
        <button
          type="button"
          className="ticker-btn"
          onClick={() =>
            setTickerIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)
          }
          aria-label="Previous announcement"
        >
          &lt;
        </button>
        <span className="ticker-text">{ANNOUNCEMENTS[tickerIdx]}</span>
        <button
          type="button"
          className="ticker-btn"
          onClick={() => setTickerIdx((i) => (i + 1) % ANNOUNCEMENTS.length)}
          aria-label="Next announcement"
        >
          &gt;
        </button>
      </div>

      {/* Sticky Header */}
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <a href="#hero-3d" className="brand-wordmark">
            STREET
          </a>

          <nav className="main-nav">
            <a href="#hero-3d">HOME</a>
            <a href="#shop-grid">SHOP</a>
            <a href="#editorial-grid">LOOKBOOK</a>
            <a href="#split-categories">CATEGORIES</a>
            <a href="#footer-street">ABOUT US</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              SEARCH
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setCartOpen(true)}
            >
              SAVED ({wishlist.length})
            </button>
            <button
              type="button"
              className="cart-pill"
              onClick={() => setCartOpen(true)}
            >
              BAG ({totalCartCount})
            </button>
          </div>
        </div>
      </header>

      {/* 2. Interactive 3D Hero Stage */}
      <section
        id="hero-3d"
        className={`hero-stage scene-${scene}`}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="scene-switcher">
          <button
            type="button"
            className={scene === 'meadow' ? 'active' : ''}
            onClick={() => setScene('meadow')}
          >
            MEADOW 3D
          </button>
          <button
            type="button"
            className={scene === 'atmosphere' ? 'active' : ''}
            onClick={() => setScene('atmosphere')}
          >
            NIGHT SKY 3D
          </button>
          <button
            type="button"
            className={scene === 'studio' ? 'active' : ''}
            onClick={() => setScene('studio')}
          >
            STUDIO 3D
          </button>
        </div>

        <div className="hero-meta-top">
          <div className="hero-small-logo">STREET</div>
          <div className="hero-drop-label">PROCEDURAL 3D DROP // NO EXTERNAL IMAGES</div>
        </div>

        <div className="perspective-wrap">
          <div
            className="sculpture-3d"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            <div className="sculpture-layer layer-back">STREET</div>
            <div className="sculpture-layer layer-mid">STREET</div>
            <div className="sculpture-layer layer-front">STREET</div>
            <div className="chrome-orb" />
          </div>
        </div>

        <div className="hero-floor-grid" />
      </section>

      {/* 3. Split Featured Categories + Procedural Product Preview */}
      <section id="split-categories" className="split-section">
        <div className="split-left">
          <p className="eyebrow">SELECT DEPARTMENT</p>
          <ul className="category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  className={`category-item ${activeCategory === cat ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="split-right">
          <div className="split-card-3d">
            <span className="badge-tag">{activeCategory} // 3D VIEW</span>
            <GarmentCanvas
              pattern={featuredSplitProduct.pattern}
              accentA={featuredSplitProduct.accentA}
              accentB={featuredSplitProduct.accentB}
              label={`${activeCategory} — ${featuredSplitProduct.name}`}
            />
            <div className="split-card-footer">
              <div>
                <h3>{featuredSplitProduct.name}</h3>
                <p>{featuredSplitProduct.fabric}</p>
              </div>
              <button
                type="button"
                className="solid-btn"
                onClick={() => {
                  setActiveProduct(featuredSplitProduct);
                  setPdpSize(featuredSplitProduct.sizes[0] ?? 'L');
                  setPdpQty(1);
                }}
              >
                INSPECT PIECE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Zip Hoodies Carousel / Grid */}
      <section id="shop-grid" className="catalog-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">FEATURED CAPSULE</span>
            <h2>ZIP HOODIES</h2>
          </div>
          <div className="toolbar-controls">
            <button
              type="button"
              className={`ghost-btn ${inStockOnly ? 'is-selected' : ''}`}
              onClick={() => setInStockOnly((v) => !v)}
            >
              {inStockOnly ? 'IN STOCK: ON' : 'IN STOCK ONLY'}
            </button>
            <select
              className="select-control"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
              }
            >
              <option value="featured">SORT: FEATURED</option>
              <option value="price-asc">PRICE: LOW TO HIGH</option>
              <option value="price-desc">PRICE: HIGH TO LOW</option>
            </select>
          </div>
        </div>

        {/* Size filter pills */}
        <div className="size-filter-bar">
          <span className="filter-label">SIZE:</span>
          <button
            type="button"
            className={`size-pill ${selectedSizeFilter === null ? 'active' : ''}`}
            onClick={() => setSelectedSizeFilter(null)}
          >
            ALL
          </button>
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`size-pill ${selectedSizeFilter === sz ? 'active' : ''}`}
              onClick={() =>
                setSelectedSizeFilter((prev) => (prev === sz ? null : sz))
              }
            >
              {sz}
            </button>
          ))}
        </div>

        <div className="product-grid-4">
          {filteredProducts.map((product) => {
            const wished = wishlist.includes(product.id);
            return (
              <article key={product.id} className="product-card">
                <div className="product-card-top">
                  <span className="item-index">{product.code}</span>
                  <button
                    type="button"
                    className={`wish-btn ${wished ? 'is-wished' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    {wished ? '♥' : '♡'}
                  </button>
                </div>

                <div
                  className="product-media-box"
                  onClick={() => {
                    setActiveProduct(product);
                    setPdpSize(product.sizes[0] ?? 'L');
                    setPdpQty(1);
                  }}
                >
                  <GarmentCanvas
                    pattern={product.pattern}
                    accentA={product.accentA}
                    accentB={product.accentB}
                    label={product.name}
                    compact
                  />
                </div>

                <div className="product-meta">
                  <h3
                    onClick={() => {
                      setActiveProduct(product);
                      setPdpSize(product.sizes[0] ?? 'L');
                      setPdpQty(1);
                    }}
                  >
                    {product.name}
                  </h3>
                  <div className="price-row">
                    {product.price !== null ? (
                      <span className="price-text">${product.price.toFixed(2)}</span>
                    ) : (
                      <span className="sold-out-text">SOLD OUT</span>
                    )}
                    <button
                      type="button"
                      className="quick-add-btn"
                      disabled={product.price === null}
                      onClick={() => addToCart(product, product.sizes[0] ?? 'L', 1)}
                    >
                      + ADD
                    </button>
                  </div>
                  <div className="card-sizes">
                    {product.sizes.slice(0, 5).map((s) => (
                      <span key={s} className="mini-size">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. Editorial Lookbook Strip ("FOLLOW @STREET") */}
      <section id="editorial-grid" className="editorial-section">
        <div className="section-head">
          <h2>FOLLOW @STREET</h2>
          <span className="handle-text">@STREET // 3D ARCHIVE</span>
        </div>
        <div className="editorial-5-grid">
          {[
            { tag: '01 / 3D FORM', bg: '#111827', fg: '#f8fafc' },
            { tag: '02 / HEAVY FLEECE', bg: '#1e293b', fg: '#e2e8f0' },
            { tag: '03 / STREET LAB', bg: '#0f172a', fg: '#93c5fd' },
            { tag: '04 / MONOLITH', bg: '#18181b', fg: '#fafafa' },
            { tag: '05 / DROP 02', bg: '#27272a', fg: '#fde68a' },
          ].map((tile) => (
            <div
              key={tile.tag}
              className="editorial-tile"
              style={{ backgroundColor: tile.bg, color: tile.fg }}
            >
              <span className="tile-ring" />
              <span className="tile-brand">STREET</span>
              <span className="tile-sub">{tile.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Giant Brand Wordmark Footer */}
      <footer id="footer-street" className="site-footer">
        <div className="footer-top-row">
          <div>
            <strong>STREET</strong> — Procedural 3D Streetwear Concept
          </div>
          <div className="footer-links">
            <span>INSTAGRAM</span>
            <span>TIKTOK</span>
            <span>X / TWITTER</span>
            <span>DISCORD</span>
          </div>
          <div className="payment-badges">
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>AMEX</span>
            <span>PAYPAL</span>
          </div>
        </div>
        <div className="giant-wordmark">STREET</div>
      </footer>

      {/* 7. Full-Screen Search Overlay */}
      {searchOpen && (
        <div className="overlay-backdrop">
          <div className="search-panel">
            <div className="search-top">
              <input
                type="text"
                autoFocus
                placeholder="WHAT ARE YOU LOOKING FOR?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-giant"
              />
              <button
                type="button"
                className="close-btn"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </div>

            <p className="eyebrow">FEATURED PRODUCTS</p>
            <div className="product-grid-4">
              {searchResults.map((p) => (
                <div key={p.id} className="product-card compact-card">
                  <GarmentCanvas
                    pattern={p.pattern}
                    accentA={p.accentA}
                    accentB={p.accentB}
                    label={p.name}
                    compact
                  />
                  <h4>{p.name}</h4>
                  <p>{p.price !== null ? `$${p.price.toFixed(2)}` : 'SOLD OUT'}</p>
                  <button
                    type="button"
                    className="quick-add-btn"
                    disabled={p.price === null}
                    onClick={() => {
                      addToCart(p, p.sizes[0] ?? 'L', 1);
                      setSearchOpen(false);
                      setCartOpen(true);
                    }}
                  >
                    + ADD TO BAG
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Product Detail Modal (PDP) */}
      {activeProduct && (
        <div
          className="overlay-backdrop"
          onClick={() => setActiveProduct(null)}
        >
          <div className="pdp-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-btn pdp-close"
              onClick={() => setActiveProduct(null)}
            >
              ✕
            </button>

            <div className="pdp-left">
              <GarmentCanvas
                pattern={activeProduct.pattern}
                accentA={activeProduct.accentA}
                accentB={activeProduct.accentB}
                label={activeProduct.name}
              />
            </div>

            <div className="pdp-right">
              <span className="eyebrow">
                SHOP / {activeProduct.category} / {activeProduct.code}
              </span>
              <h2>{activeProduct.name}</h2>
              <p className="pdp-price">
                {activeProduct.price !== null
                  ? `$${activeProduct.price.toFixed(2)}`
                  : 'SOLD OUT'}
              </p>
              <p className="pdp-desc">{activeProduct.details}</p>
              <p className="pdp-fabric">FABRIC: {activeProduct.fabric}</p>

              <div className="pdp-block">
                <span className="filter-label">SIZE</span>
                <div className="size-filter-bar">
                  {activeProduct.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-pill ${pdpSize === s ? 'active' : ''}`}
                      onClick={() => setPdpSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pdp-block qty-row">
                <span className="filter-label">QTY</span>
                <div className="qty-stepper">
                  <button
                    type="button"
                    onClick={() => setPdpQty((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span>{pdpQty}</span>
                  <button type="button" onClick={() => setPdpQty((q) => q + 1)}>
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="solid-btn full-width"
                disabled={activeProduct.price === null}
                onClick={() => {
                  addToCart(activeProduct, pdpSize, pdpQty);
                  setActiveProduct(null);
                  setCartOpen(true);
                }}
              >
                {activeProduct.price !== null ? 'ADD TO CART' : 'SOLD OUT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Cart Drawer */}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h3>YOUR BAG ({totalCartCount})</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setCartOpen(false)}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart-msg">Your STREET bag is currently empty.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="cart-item-row"
                    >
                      <div>
                        <strong>{item.product.name}</strong>
                        <div className="cart-sub">
                          Size: {item.size} × {item.qty}
                        </div>
                      </div>
                      <div className="cart-item-right">
                        <span>
                          ${((item.product.price ?? 0) * item.qty).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="remove-link"
                          onClick={() =>
                            setCart((prev) =>
                              prev.filter(
                                (c) =>
                                  !(
                                    c.product.id === item.product.id &&
                                    c.size === item.size
                                  )
                              )
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="drawer-footer">
                  <div className="subtotal-row">
                    <span>SUBTOTAL</span>
                    <strong>${totalCartPrice.toFixed(2)}</strong>
                  </div>
                  <button
                    type="button"
                    className="solid-btn full-width"
                    onClick={() => {
                      alert('STREET Order Preview Confirmed!');
                      setCart([]);
                      setCartOpen(false);
                    }}
                  >
                    CHECKOUT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 10. Floating Bottom-Right Audio Widget */}
      <div className="music-widget">
        <div className="music-orb" />
        <div className="music-info">
          <strong>STREET RADIO</strong>
          <span>{musicPlaying ? 'Playing 3D Synth Loop' : 'Paused'}</span>
        </div>
        <button
          type="button"
          className="music-toggle"
          onClick={() => setMusicPlaying((p) => !p)}
        >
          {musicPlaying ? '❚❚' : '▶'}
        </button>
      </div>
    </div>
  );
}

export default App;