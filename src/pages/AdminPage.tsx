import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react'
import { CATEGORIES, PRODUCTS } from '../data'
import type { Category, Product } from '../data'
import { supabase } from '../lib/supabase'
import type { CartItem } from '../types'
import { PRICE_RANGES, money } from '../utils/format'

interface AdminOrder {
  order_number: string
  customer_name: string
  total: number
  status: string
  created_at: string
  subtotal: number
  shipping_fee: number
  discount_amount: number
  coupon_code: string | null
  payment_method: string | null
  payment_status: string
}

interface AdminProduct {
  id: string
  name: string
  category: string
  price: number | null
  is_active: boolean
  sizes: string[]
  images: string[]
}

interface AdminCustomer {
  email: string | null
  full_name: string | null
  created_at: string
}

interface AdminCoupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_subtotal: number
  max_discount: number | null
  usage_limit: number | null
  per_user_limit: number
  used_count: number
  is_active: boolean
  expires_at: string | null
}

interface AdminReview {
  id: string
  product_id: string
  rating: number
  title: string
  body: string
  status: string
  created_at: string
}

export default function AdminPage({
  active,
  setActive,
  setCatalogProducts,
  setCart,
  onProductHidden,
  footer,
}: {
  active: Product
  setActive: Dispatch<SetStateAction<Product>>
  setCatalogProducts: Dispatch<SetStateAction<Product[]>>
  setCart: Dispatch<SetStateAction<CartItem[]>>
  onProductHidden: () => void
  footer: ReactNode
}) {
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminNotice, setAdminNotice] = useState('')
  const [adminUser, setAdminUser] = useState<string | null>(null)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([])
  const [adminExportNotice, setAdminExportNotice] = useState('')
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [adminCustomers, setAdminCustomers] = useState<AdminCustomer[]>([])
  const [adminPriceDrafts, setAdminPriceDrafts] = useState<Record<string, string>>({})
  const [adminStockDrafts, setAdminStockDrafts] = useState<Record<string, string>>({})
  const [adminImageFiles, setAdminImageFiles] = useState<Record<string, File | null>>({})
  const [newProductName, setNewProductName] = useState('')
  const [newProductCategory, setNewProductCategory] = useState<Category>('PANTS')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [adminCoupons, setAdminCoupons] = useState<AdminCoupon[]>([])
  const [adminReviews, setAdminReviews] = useState<AdminReview[]>([])
  const [adminShippingDraft, setAdminShippingDraft] = useState('')
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent')
  const [newCouponValue, setNewCouponValue] = useState('10')
  const [newCouponMin, setNewCouponMin] = useState('0')
  const [newCouponLimit, setNewCouponLimit] = useState('')
  const [newCouponExpiry, setNewCouponExpiry] = useState('')

  const fetchAdminWorkspaceData = useCallback(async (isAlive: () => boolean) => {
    const [
      { data: orders },
      { data: products },
      { data: stock },
      { data: customers },
      { data: coupons },
      { data: reviews },
      { data: shipping },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'order_number,customer_name,subtotal,shipping_fee,discount_amount,coupon_code,total,status,payment_method,payment_status,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('products')
        .select('id,name,category,price,is_active,sizes,images')
        .order('category')
        .order('name'),
      supabase.from('inventory').select('product_id,size,quantity'),
      supabase
        .from('profiles')
        .select('email,full_name,created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('coupons')
        .select(
          'id,code,discount_type,discount_value,min_subtotal,max_discount,usage_limit,per_user_limit,used_count,is_active,expires_at',
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('product_reviews')
        .select('id,product_id,rating,title,body,status,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('store_settings').select('value').eq('key', 'shipping_fee').maybeSingle(),
    ])
    if (!isAlive()) return
    setAdminOrders(orders ?? [])
    setAdminProducts(products ?? [])
    setAdminPriceDrafts(
      Object.fromEntries(
        (products ?? []).map((p) => [p.id, p.price == null ? '' : String(p.price)]),
      ),
    )
    setAdminStockDrafts(
      Object.fromEntries(
        (stock ?? []).map((row) => [`${row.product_id}::${row.size}`, String(row.quantity)]),
      ),
    )
    setAdminCustomers(customers ?? [])
    setAdminCoupons(coupons ?? [])
    setAdminReviews(reviews ?? [])
    setAdminShippingDraft(shipping?.value == null ? '' : String(shipping.value))
  }, [])

  useEffect(() => {
    let alive = true
    const loadAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!alive) return
      setAdminUser(session?.user.email ?? null)
      if (!session?.user) {
        setAdminRole(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!alive) return
      setAdminRole(data?.role ?? 'customer')
      if (data?.role === 'admin') {
        await fetchAdminWorkspaceData(() => alive)
      }
    }
    void loadAdmin()
    return () => {
      alive = false
    }
  }, [fetchAdminWorkspaceData])

  const adminSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminNotice('CHECKING ACCESS…')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim(),
      password: adminPassword,
    })
    if (error || !data.user) {
      setAdminNotice(error?.message ?? 'Unable to sign in.')
      return
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()
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
    await fetchAdminWorkspaceData(() => true)
  }

  const saveAdminPrice = async (id: string) => {
    const raw = adminPriceDrafts[id]?.trim() ?? ''
    const product = adminProducts.find((item) => item.id === id)
    if (!product) return
    const price = Number(raw)
    const range = PRICE_RANGES[product.category as Category]
    if (!raw || !Number.isFinite(price) || price < range.min || price > range.max) {
      setAdminNotice(
        `PRICE MUST BE BETWEEN EGP ${range.min.toLocaleString('en-EG')} AND EGP ${range.max.toLocaleString('en-EG')} FOR ${product.category}.`,
      )
      return
    }
    const { error } = await supabase
      .from('products')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminProducts((items) => items.map((item) => (item.id === id ? { ...item, price } : item)))
    setCatalogProducts((items) => items.map((item) => (item.id === id ? { ...item, price } : item)))
    setCart((items) =>
      items.map((item) =>
        item.product.id === id ? { ...item, product: { ...item.product, price } } : item,
      ),
    )
    setActive((item) => (item.id === id ? { ...item, price } : item))
    setAdminNotice('PRODUCT PRICE UPDATED.')
  }

  const createAdminProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newProductName.trim().toUpperCase()
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const id = `${newProductCategory.toLowerCase()}-${slug}-${Date.now().toString(36)}`
    const rawPrice = newProductPrice.trim()
    const range = PRICE_RANGES[newProductCategory]
    const price = rawPrice === '' ? range.default : Number(rawPrice)
    if (!Number.isFinite(price) || price < range.min || price > range.max) {
      setAdminNotice(
        `PRICE MUST BE BETWEEN EGP ${range.min.toLocaleString('en-EG')} AND EGP ${range.max.toLocaleString('en-EG')} FOR ${newProductCategory}.`,
      )
      return
    }
    const sizes =
      newProductCategory === 'PANTS'
        ? ['30', '32', '34', '36', '38', '40', '42']
        : ['S', 'M', 'L', 'XL']
    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        name,
        category: newProductCategory,
        description: 'STREET product.',
        price,
        sizes,
        images: [],
        color: '#292929',
        is_active: true,
      })
      .select('id,name,category,price,is_active,sizes,images')
      .single()
    if (error || !data) {
      setAdminNotice(error?.message ?? 'PRODUCT COULD NOT BE CREATED.')
      return
    }
    const product: Product = {
      id: data.id,
      name: data.name,
      category: data.category as Category,
      price: data.price == null ? 0 : Number(data.price),
      sizes: data.sizes,
      images: data.images ?? [],
      color: '#292929',
      stockBySize: Object.fromEntries(data.sizes.map((size: string) => [size, 0])),
      soldOut: true,
      details: ['Product information will be updated.'],
    }
    setAdminProducts((items) => [...items, data])
    setAdminPriceDrafts((items) => ({ ...items, [id]: rawPrice }))
    setCatalogProducts((items) => [product, ...items])
    setNewProductName('')
    setNewProductPrice('')
    setAdminNotice('NEW PRODUCT CREATED. ADD ITS PHOTOS AND STOCK BELOW.')
  }

  const uploadAdminImage = async (id: string) => {
    const file = adminImageFiles[id]
    if (!file) {
      setAdminNotice('CHOOSE AN IMAGE FIRST.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setAdminNotice('USE JPG, PNG, WEBP OR AVIF.')
      return
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${id}/${Date.now()}-${safeName}`
    setAdminNotice('UPLOADING PRODUCT IMAGE…')
    const { error: uploadError } = await supabase.storage
      .from('street-product-images')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      setAdminNotice(uploadError.message)
      return
    }
    const { data: publicData } = supabase.storage.from('street-product-images').getPublicUrl(path)
    const current = adminProducts.find((product) => product.id === id)
    const images = [
      ...(current?.images ?? PRODUCTS.find((product) => product.id === id)?.images ?? []),
      publicData.publicUrl,
    ]
    const { error } = await supabase
      .from('products')
      .update({ images, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminProducts((items) =>
      items.map((item) => (item.id === id ? { ...item, images } : item)),
    )
    setCatalogProducts((items) =>
      items.map((item) => (item.id === id ? { ...item, images } : item)),
    )
    setAdminImageFiles((items) => ({ ...items, [id]: null }))
    setAdminNotice('PRODUCT IMAGE ADDED.')
  }

  const saveAdminStock = async (productId: string, size: string) => {
    const key = `${productId}::${size}`
    const rawQuantity = adminStockDrafts[key]?.trim() ?? ''
    const quantity = Number(rawQuantity)
    if (rawQuantity === '' || !Number.isInteger(quantity) || quantity < 0) {
      setAdminNotice('ENTER A WHOLE NUMBER FOR STOCK.')
      return
    }
    const { error } = await supabase
      .from('inventory')
      .upsert(
        { product_id: productId, size, quantity, updated_at: new Date().toISOString() },
        { onConflict: 'product_id,size' },
      )
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setCatalogProducts((items) =>
      items.map((product) => {
        if (product.id !== productId) return product
        const stockBySize = Object.fromEntries(
          product.sizes.map((item) => [item, product.stockBySize?.[item] ?? 0]),
        )
        stockBySize[size] = quantity
        return {
          ...product,
          stockBySize,
          soldOut: product.sizes.every((item) => stockBySize[item] <= 0),
        }
      }),
    )
    setActive((product) => {
      if (product.id !== productId) return product
      const stockBySize = Object.fromEntries(
        product.sizes.map((item) => [item, product.stockBySize?.[item] ?? 0]),
      )
      stockBySize[size] = quantity
      return {
        ...product,
        stockBySize,
        soldOut: product.sizes.every((item) => stockBySize[item] <= 0),
      }
    })
    setAdminNotice('STOCK UPDATED.')
  }

  const toggleAdminProduct = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminProducts((items) =>
      items.map((item) => (item.id === id ? { ...item, is_active: !is_active } : item)),
    )
    if (is_active) {
      setCatalogProducts((items) => items.filter((item) => item.id !== id))
      if (active.id === id) onProductHidden()
    } else {
      const base = PRODUCTS.find((item) => item.id === id)
      const current = adminProducts.find((item) => item.id === id)
      if (base) {
        setCatalogProducts((items) => [
          ...items.filter((item) => item.id !== id),
          { ...base, price: current?.price ?? 0 },
        ])
      }
    }
  }

  const exportAdminOrders = () => {
    if (!adminOrders.length) {
      setAdminExportNotice('NO ORDER DATA TO EXPORT.')
      return
    }
    const columns = [
      'order_number',
      'customer_name',
      'subtotal_egp',
      'shipping_fee',
      'discount_egp',
      'coupon_code',
      'total_egp',
      'payment_method',
      'payment_status',
      'order_status',
      'created_at',
    ]
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
    const csv = [columns, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const safe = String(value ?? '').replace(/"/g, '""')
            return /[",\n]/.test(safe) ? `"${safe}"` : safe
          })
          .join(','),
      )
      .join('\r\n')
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    })
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

  const createAdminCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = newCouponCode.trim().toUpperCase()
    const value = Number(newCouponValue)
    const min = Number(newCouponMin || 0)
    const limit = newCouponLimit.trim() ? Number(newCouponLimit) : null
    if (
      !/^[A-Z0-9_-]{3,32}$/.test(code) ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (newCouponType === 'percent' && value > 100) ||
      !Number.isFinite(min) ||
      min < 0 ||
      (limit !== null && (!Number.isInteger(limit) || limit < 1))
    ) {
      setAdminNotice('CHECK COUPON CODE, VALUE, MINIMUM AND USAGE LIMIT.')
      return
    }
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        discount_type: newCouponType,
        discount_value: value,
        min_subtotal: min,
        usage_limit: limit,
        per_user_limit: 1,
        expires_at: newCouponExpiry ? new Date(newCouponExpiry).toISOString() : null,
      })
      .select(
        'id,code,discount_type,discount_value,min_subtotal,max_discount,usage_limit,per_user_limit,used_count,is_active,expires_at',
      )
      .single()
    if (error || !data) {
      setAdminNotice(error?.message ?? 'COUPON COULD NOT BE CREATED.')
      return
    }
    setAdminCoupons((items) => [data, ...items])
    setNewCouponCode('')
    setAdminNotice('COUPON CREATED.')
  }

  const toggleAdminCoupon = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('coupons').update({ is_active: !isActive }).eq('id', id)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminCoupons((items) =>
      items.map((item) => (item.id === id ? { ...item, is_active: !isActive } : item)),
    )
  }

  const moderateReview = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminReviews((items) => items.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const saveAdminShipping = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fee = Number(adminShippingDraft)
    if (adminShippingDraft.trim() === '' || !Number.isFinite(fee) || fee < 0) {
      setAdminNotice('ENTER A VALID DELIVERY FEE.')
      return
    }
    const { error } = await supabase
      .from('store_settings')
      .upsert({ key: 'shipping_fee', value: fee, updated_at: new Date().toISOString() })
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminNotice('DELIVERY FEE SAVED.')
  }

  const updateAdminOrder = async (order_number: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('order_number', order_number)
    if (error) {
      setAdminNotice(error.message)
      return
    }
    setAdminOrders((items) =>
      items.map((item) => (item.order_number === order_number ? { ...item, status } : item)),
    )
  }

  return (
    <main id="main-content" className="utility-page admin-page modern-admin">
      <div className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-brand-mark">S</span>
          <div>
            <b>STREET</b>
            <small>COMMERCE / ADMIN</small>
          </div>
        </div>
        <div className="admin-topbar-meta">
          <span className="admin-live-dot" /> PRIVATE WORKSPACE{' '}
          <span className="admin-topbar-divider">/</span> 010
        </div>
      </div>
      <div className="admin-welcome">
        <div>
          <small>OVERVIEW / CONTROL CENTER</small>
          <h1>
            STORE
            <br />
            <span>COMMAND.</span>
          </h1>
          <p>Everything happening across your STREET store, in one place.</p>
        </div>
        {adminUser && (
          <div className="admin-session">
            <span>SIGNED IN AS</span>
            <b>{adminUser}</b>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                setAdminUser(null)
                setAdminRole(null)
                setAdminNotice('SIGNED OUT.')
              }}
            >
              SIGN OUT ↗
            </button>
          </div>
        )}
      </div>
      {!adminUser ? (
        <form className="admin-login" onSubmit={adminSignIn}>
          <label>ADMIN EMAIL</label>
          <input
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="name@domain.com"
          />
          <label>PASSWORD</label>
          <input
            type="password"
            required
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Your password"
          />
          <button className="solid" type="submit">
            SIGN IN ↗
          </button>
          {adminNotice && <p>{adminNotice}</p>}
        </form>
      ) : adminRole === 'admin' ? (
        <>
          <div className="admin-layout">
            <aside className="admin-sidebar">
              <small>WORKSPACE</small>
              <a className="admin-side-link active" href="#admin-overview">
                <span>01</span> Overview
              </a>
              <a className="admin-side-link" href="#admin-create">
                <span>02</span> Add product
              </a>
              <a className="admin-side-link" href="#admin-products">
                <span>03</span> Products
              </a>
              <a className="admin-side-link" href="#admin-customers">
                <span>04</span> Customers
              </a>
              <a className="admin-side-link" href="#admin-orders">
                <span>05</span> Orders
              </a>
              <a className="admin-side-link" href="#admin-coupons">
                <span>06</span> Coupons
              </a>
              <a className="admin-side-link" href="#admin-reviews">
                <span>07</span> Reviews
              </a>
              <a className="admin-side-link" href="#admin-settings">
                <span>08</span> Settings
              </a>
              <div className="admin-sidebar-bottom">
                <span className="admin-live-dot" /> STORE SYSTEM
                <br />
                <b>OPERATIONAL</b>
              </div>
            </aside>
            <div className="admin-content">
              <section className="admin-analytics" aria-label="Order analytics">
                <div className="admin-analytics-head">
                  <div>
                    <small>COMMERCE / PERFORMANCE</small>
                    <h2>ORDER OVERVIEW</h2>
                    <span>BASED ON THE 100 MOST RECENT ORDERS LOADED</span>
                  </div>
                  <button type="button" onClick={exportAdminOrders}>
                    EXPORT ORDERS CSV ↗
                  </button>
                </div>
                <div className="admin-analytics-metrics">
                  <article>
                    <small>RECENT ORDER VALUE</small>
                    <strong>
                      {money(adminOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))}
                    </strong>
                    <span>NOT A PAYMENT SETTLEMENT TOTAL</span>
                  </article>
                  <article>
                    <small>DELIVERED</small>
                    <strong>
                      {adminOrders.filter((order) => order.status === 'delivered').length}
                    </strong>
                    <span>COMPLETED ORDERS</span>
                  </article>
                  <article>
                    <small>CANCELLED</small>
                    <strong>
                      {adminOrders.filter((order) => order.status === 'cancelled').length}
                    </strong>
                    <span>CANCELLED ORDERS</span>
                  </article>
                  <article>
                    <small>AVERAGE ORDER</small>
                    <strong>
                      {adminOrders.length
                        ? money(
                            adminOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) /
                              adminOrders.length,
                          )
                        : money(0)}
                    </strong>
                    <span>RECENT RECORDS ONLY</span>
                  </article>
                </div>
                {adminExportNotice && (
                  <p className="admin-export-notice" role="status">
                    {adminExportNotice}
                  </p>
                )}
              </section>
              <section id="admin-overview" className="admin-overview" aria-label="Store overview">
                <div>
                  <small>CATALOGUE</small>
                  <strong>{adminProducts.length}</strong>
                  <span>ALL PIECES</span>
                </div>
                <div>
                  <small>LIVE</small>
                  <strong>{adminProducts.filter((p) => p.is_active).length}</strong>
                  <span>VISIBLE PRODUCTS</span>
                </div>
                <div>
                  <small>ORDERS</small>
                  <strong>{adminOrders.length}</strong>
                  <span>RECENT RECORDS</span>
                </div>
                <div>
                  <small>TO PROCESS</small>
                  <strong>
                    {
                      adminOrders.filter((o) =>
                        ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status),
                      ).length
                    }
                  </strong>
                  <span>OPEN ORDERS</span>
                </div>
                <div>
                  <small>CUSTOMERS</small>
                  <strong>{adminCustomers.length}</strong>
                  <span>REGISTERED ACCOUNTS</span>
                </div>
              </section>
              <form id="admin-create" className="admin-create-product" onSubmit={createAdminProduct}>
                <div className="admin-section-title">
                  <h2>ADD A NEW PIECE</h2>
                  <span>CATALOGUE ENTRY</span>
                </div>
                <input
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="PRODUCT NAME"
                />
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  inputMode="decimal"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder={`PRICE / EGP ${PRICE_RANGES[newProductCategory].min}–${PRICE_RANGES[newProductCategory].max}`}
                />
                <button type="submit">CREATE PRODUCT ↗</button>
              </form>
              <section id="admin-products" className="admin-products">
                <div className="admin-section-title">
                  <h2>PRODUCT CONTROL / {adminProducts.length}</h2>
                  <span>PRICES, STOCK, PHOTOS &amp; VISIBILITY</span>
                </div>
                {adminProducts.map((p) => (
                  <article key={p.id}>
                    <div>
                      <b>{p.name}</b>
                      <small>{p.category}</small>
                    </div>
                    <label>
                      <span>
                        PRICE / EGP {PRICE_RANGES[p.category as Category].min}–
                        {PRICE_RANGES[p.category as Category].max}
                      </span>
                      <input
                        aria-label={p.name + ' price'}
                        inputMode="decimal"
                        value={adminPriceDrafts[p.id] ?? String(p.price ?? '')}
                        placeholder="Set price"
                        onChange={(e) =>
                          setAdminPriceDrafts((drafts) => ({ ...drafts, [p.id]: e.target.value }))
                        }
                      />
                    </label>
                    <button onClick={() => void saveAdminPrice(p.id)}>SAVE</button>
                    <button
                      className={p.is_active ? 'active' : ''}
                      onClick={() => void toggleAdminProduct(p.id, p.is_active)}
                    >
                      {p.is_active ? 'LIVE' : 'HIDDEN'}
                    </button>
                    <div className="admin-stock-grid">
                      {p.sizes.map((size) => (
                        <label key={size}>
                          <span>{size} / QTY</span>
                          <input
                            aria-label={p.name + ' ' + size + ' stock'}
                            inputMode="numeric"
                            value={adminStockDrafts[`${p.id}::${size}`] ?? ''}
                            placeholder="Not set"
                            onChange={(e) =>
                              setAdminStockDrafts((drafts) => ({
                                ...drafts,
                                [`${p.id}::${size}`]: e.target.value,
                              }))
                            }
                          />
                          <button onClick={() => void saveAdminStock(p.id, size)}>SAVE STOCK</button>
                        </label>
                      ))}
                    </div>
                    <div className="admin-image-upload">
                      <label>
                        ADD PRODUCT IMAGE
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={(e) =>
                            setAdminImageFiles((items) => ({
                              ...items,
                              [p.id]: e.target.files?.[0] ?? null,
                            }))
                          }
                        />
                      </label>
                      <button onClick={() => void uploadAdminImage(p.id)}>UPLOAD IMAGE ↗</button>
                    </div>
                  </article>
                ))}
              </section>
              <section id="admin-customers" className="admin-customers">
                <div className="admin-section-title">
                  <h2>CUSTOMER DIRECTORY / {adminCustomers.length}</h2>
                  <span>REGISTERED ACCOUNTS</span>
                </div>
                {adminCustomers.length === 0 ? (
                  <p>NO CUSTOMER ACCOUNTS YET.</p>
                ) : (
                  adminCustomers.map((customer, i) => (
                    <article key={customer.email ?? i}>
                      <b>{customer.full_name || 'STREET CUSTOMER'}</b>
                      <span>{customer.email}</span>
                      <small>{new Date(customer.created_at).toLocaleDateString()}</small>
                    </article>
                  ))
                )}
              </section>
              <section id="admin-orders" className="admin-orders">
                <div>
                  <h2>RECENT ORDERS</h2>
                  <span>{adminOrders.length} / 100 RECORDS</span>
                </div>
                {adminOrders.length === 0 ? (
                  <p>NO ORDERS HAVE BEEN PLACED YET.</p>
                ) : (
                  adminOrders.map((o) => (
                    <article key={o.order_number}>
                      <b>{o.order_number}</b>
                      <span>
                        {o.customer_name}
                        <small className="admin-order-meta">
                          {o.payment_method === 'cash_on_delivery'
                            ? 'CASH ON DELIVERY'
                            : (o.payment_method ?? 'PAYMENT UNSET')}{' '}
                          / {(o.payment_status ?? 'unpaid').toUpperCase()}
                          {o.coupon_code ? ' / ' + o.coupon_code : ''}
                        </small>
                      </span>
                      <select
                        value={o.status}
                        onChange={(e) => void updateAdminOrder(o.order_number, e.target.value)}
                      >
                        <option value="pending">PENDING</option>
                        <option value="confirmed">CONFIRMED</option>
                        <option value="processing">PROCESSING</option>
                        <option value="shipped">SHIPPED</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancelled">CANCELLED</option>
                      </select>
                      <strong>{money(Number(o.total))}</strong>
                    </article>
                  ))
                )}
              </section>
              <section id="admin-coupons" className="admin-coupons">
                <div className="admin-section-title">
                  <h2>DISCOUNT CODES / {adminCoupons.length}</h2>
                  <span>COUPON MANAGEMENT</span>
                </div>
                <form className="admin-coupon-form" onSubmit={createAdminCoupon}>
                  <label>
                    CODE
                    <input
                      required
                      minLength={3}
                      maxLength={32}
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="STREET10"
                    />
                  </label>
                  <label>
                    TYPE
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                    >
                      <option value="percent">PERCENT</option>
                      <option value="fixed">FIXED EGP</option>
                    </select>
                  </label>
                  <label>
                    VALUE
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      max={newCouponType === 'percent' ? 100 : undefined}
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                    />
                  </label>
                  <label>
                    MINIMUM EGP
                    <input
                      type="number"
                      min="0"
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(e.target.value)}
                    />
                  </label>
                  <label>
                    USAGE LIMIT
                    <input
                      type="number"
                      min="1"
                      value={newCouponLimit}
                      onChange={(e) => setNewCouponLimit(e.target.value)}
                      placeholder="Unlimited"
                    />
                  </label>
                  <label>
                    EXPIRES
                    <input
                      type="date"
                      value={newCouponExpiry}
                      onChange={(e) => setNewCouponExpiry(e.target.value)}
                    />
                  </label>
                  <button type="submit">CREATE COUPON ↗</button>
                </form>
                {adminCoupons.length === 0 ? (
                  <p>NO COUPONS CREATED YET.</p>
                ) : (
                  adminCoupons.map((coupon) => (
                    <article className="admin-coupon-row" key={coupon.id}>
                      <div>
                        <b>{coupon.code}</b>
                        <small>
                          {coupon.discount_type === 'percent'
                            ? coupon.discount_value + '% OFF'
                            : money(coupon.discount_value) + ' OFF'}{' '}
                          / MIN {money(coupon.min_subtotal)}
                        </small>
                      </div>
                      <span>
                        {coupon.used_count}
                        {coupon.usage_limit === null ? '' : ' / ' + coupon.usage_limit} USED
                      </span>
                      <small>
                        {coupon.expires_at
                          ? 'EXPIRES ' + new Date(coupon.expires_at).toLocaleDateString()
                          : 'NO EXPIRY'}
                      </small>
                      <button
                        className={coupon.is_active ? 'active' : ''}
                        onClick={() => void toggleAdminCoupon(coupon.id, coupon.is_active)}
                      >
                        {coupon.is_active ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </article>
                  ))
                )}
              </section>
              <section id="admin-reviews" className="admin-review-moderation">
                <div className="admin-section-title">
                  <h2>
                    REVIEW MODERATION /{' '}
                    {adminReviews.filter((review) => review.status === 'pending').length} PENDING
                  </h2>
                  <span>CUSTOMER FEEDBACK</span>
                </div>
                {adminReviews.length === 0 ? (
                  <p>NO CUSTOMER REVIEWS YET.</p>
                ) : (
                  adminReviews.map((review) => (
                    <article key={review.id}>
                      <div>
                        <b>{review.title}</b>
                        <span>
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      <p>{review.body}</p>
                      <small>
                        {review.product_id} / {review.status.toUpperCase()} /{' '}
                        {new Date(review.created_at).toLocaleDateString()}
                      </small>
                      {review.status === 'pending' && (
                        <div>
                          <button onClick={() => void moderateReview(review.id, 'approved')}>
                            APPROVE
                          </button>
                          <button onClick={() => void moderateReview(review.id, 'rejected')}>
                            REJECT
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </section>
              <section id="admin-settings" className="admin-store-settings">
                <div className="admin-section-title">
                  <h2>STORE SETTINGS</h2>
                  <span>DELIVERY CONFIGURATION</span>
                </div>
                <form onSubmit={saveAdminShipping}>
                  <label>
                    STANDARD DELIVERY FEE / EGP
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={adminShippingDraft}
                      onChange={(e) => setAdminShippingDraft(e.target.value)}
                      placeholder="Enter delivery fee"
                    />
                  </label>
                  <button type="submit">SAVE DELIVERY FEE ↗</button>
                </form>
                <p>
                  Checkout remains unavailable until a delivery fee is configured. Payment is
                  currently cash on delivery only.
                </p>
              </section>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-message">
          {adminNotice || 'THIS ACCOUNT DOES NOT HAVE ADMIN PERMISSIONS.'}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              setAdminUser(null)
              setAdminRole(null)
              setAdminNotice('SIGNED OUT.')
            }}
          >
            SIGN OUT
          </button>
        </div>
      )}
      {footer}
    </main>
  )
}
