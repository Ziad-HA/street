import { useEffect, useState } from 'react'
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react'
import type { Product } from '../data'
import { supabase } from '../lib/supabase'
import type { CartItem, Page } from '../types'
import { money, moneyValue } from '../utils/format'
import { Img } from '../components/Shared'

export default function CheckoutPage({
  cart,
  setCart,
  setCatalogProducts,
  go,
  footer,
}: {
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
  setCatalogProducts: Dispatch<SetStateAction<Product[]>>
  go: (p: Page, anchor?: string) => void
  footer: ReactNode
}) {
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
  const [orderSuccess, setOrderSuccess] = useState<{
    order_number: string
    total: number
    guest: boolean
  } | null>(null)

  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const subtotal = cart.reduce((n, i) => n + i.product.price * i.qty, 0)
  const checkoutTotal = Math.max(0, subtotal - checkoutDiscount) + (checkoutShipping ?? 0)

  // Track previous subtotal to invalidate applied coupon on bag changes without useEffect setState.
  const [prevSubtotal, setPrevSubtotal] = useState(subtotal)
  if (prevSubtotal !== subtotal) {
    setPrevSubtotal(subtotal)
    if (checkoutCouponCode) {
      setCheckoutCouponCode('')
      setCheckoutDiscount(0)
      setCheckoutNotice('YOUR BAG CHANGED. APPLY THE COUPON AGAIN.')
    }
  }

  useEffect(() => {
    let alive = true
    const loadCheckoutSession = async () => {
      const [{ data: { user } }, { data: setting }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('store_settings').select('value').eq('key', 'shipping_fee').maybeSingle(),
      ])
      if (!alive) return
      setCheckoutEmail(user?.email ?? '')
      const fullName = user?.user_metadata?.full_name
      if (typeof fullName === 'string') setCheckoutName(fullName)
      const value = setting?.value
      setCheckoutShipping(value === null || value === undefined ? null : Number(value))
    }
    void loadCheckoutSession()
    return () => {
      alive = false
    }
  }, [])

  const applyCheckoutCoupon = async () => {
    if (!checkoutCoupon.trim()) {
      setCheckoutCouponCode('')
      setCheckoutDiscount(0)
      setCheckoutNotice('COUPON REMOVED.')
      return
    }
    const { data, error } = await supabase.rpc('validate_street_coupon', {
      p_code: checkoutCoupon.trim(),
      p_subtotal: subtotal,
    })
    if (error || !data?.valid) {
      setCheckoutCouponCode('')
      setCheckoutDiscount(0)
      setCheckoutNotice(data?.message ?? error?.message ?? 'COUPON COULD NOT BE VALIDATED.')
      return
    }
    setCheckoutCouponCode(data.code)
    setCheckoutDiscount(Number(data.discount) || 0)
    setCheckoutNotice(data.message ?? 'COUPON APPLIED.')
  }

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checkoutBusy || !cart.length) return
    setCheckoutBusy(true)
    setCheckoutNotice('VALIDATING YOUR ORDER…')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data, error } = await supabase.rpc('create_street_order', {
      p_customer: {
        email: checkoutEmail.trim(),
        full_name: checkoutName,
        phone: checkoutPhone,
        address: checkoutAddress,
        city: checkoutCity,
        notes: checkoutNotes,
      },
      p_items: cart.map((item) => ({
        product_id: item.product.id,
        size: item.size,
        quantity: item.qty,
      })),
      p_coupon_code: checkoutCouponCode || null,
    })
    setCheckoutBusy(false)
    if (error || !data?.order_number) {
      setCheckoutNotice(error?.message ?? 'ORDER COULD NOT BE CREATED.')
      return
    }
    setOrderSuccess({ order_number: data.order_number, total: Number(data.total), guest: !user })
    setCatalogProducts((products) =>
      products.map((product) => {
        const stockBySize = { ...(product.stockBySize ?? {}) }
        cart
          .filter((item) => item.product.id === product.id)
          .forEach((item) => {
            stockBySize[item.size] = Math.max(0, (stockBySize[item.size] ?? 0) - item.qty)
          })
        const soldOut = product.sizes.every((size) => (stockBySize[size] ?? 0) <= 0)
        return { ...product, stockBySize, soldOut }
      }),
    )
    setCart([])
    setCheckoutCoupon('')
    setCheckoutCouponCode('')
    setCheckoutDiscount(0)
    setCheckoutNotice('ORDER PLACED. PAYMENT IS CASH ON DELIVERY.')
  }

  return (
    <main id="main-content" className="utility-page checkout-page">
      <div className="page-kicker">STREET / SECURE CHECKOUT / 009</div>
      <div className="utility-heading">
        <small>ALMOST YOURS</small>
        <h1>
          CHECK
          <br />
          <span>OUT.</span>
        </h1>
        <p>
          Place a cash-on-delivery order. Your prices, coupon and available stock are verified
          securely before the order is created.
        </p>
      </div>
      {orderSuccess ? (
        <section className="checkout-success">
          <small>STREET / ORDER CONFIRMED</small>
          <h2>
            YOU&apos;RE
            <br />
            IN.
          </h2>
          <p>YOUR ORDER NUMBER</p>
          <strong>{orderSuccess.order_number}</strong>
          <div>
            <span>ORDER TOTAL</span>
            <b>{money(orderSuccess.total)}</b>
          </div>
          <p className="checkout-note">
            PAYMENT METHOD: CASH ON DELIVERY. THE STORE TEAM WILL CONFIRM DELIVERY DETAILS.
          </p>
          {!orderSuccess.guest ? (
            <button
              className="solid"
              onClick={() => {
                setOrderSuccess(null)
                go('account')
              }}
            >
              VIEW MY ACCOUNT ↗
            </button>
          ) : (
            <button
              className="solid"
              onClick={() => {
                setOrderSuccess(null)
                go('store')
              }}
            >
              CONTINUE SHOPPING ↗
            </button>
          )}
        </section>
      ) : cart.length === 0 ? (
        <div className="checkout-summary">
          <p>YOUR BAG IS EMPTY.</p>
          <button onClick={() => go('store')}>RETURN TO SHOP ↗</button>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submitCheckout}>
            <div className="checkout-form-head">
              <small>01 / DELIVERY DETAILS</small>
              <span>{checkoutEmail ? 'ACCOUNT OR GUEST' : 'GUEST CHECKOUT'}</span>
            </div>
            <label>
              EMAIL <span>OPTIONAL</span>
              <input
                type="email"
                autoComplete="email"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <label>
              FULL NAME
              <input
                required
                minLength={2}
                autoComplete="name"
                value={checkoutName}
                onChange={(e) => setCheckoutName(e.target.value)}
                placeholder="Full name"
              />
            </label>
            <label>
              PHONE NUMBER
              <input
                required
                type="tel"
                autoComplete="tel"
                minLength={7}
                value={checkoutPhone}
                onChange={(e) => setCheckoutPhone(e.target.value)}
                placeholder="+20"
              />
            </label>
            <label>
              CITY / AREA
              <input
                required
                autoComplete="address-level2"
                value={checkoutCity}
                onChange={(e) => setCheckoutCity(e.target.value)}
                placeholder="City"
              />
            </label>
            <label>
              DELIVERY ADDRESS
              <textarea
                required
                autoComplete="street-address"
                minLength={5}
                rows={3}
                value={checkoutAddress}
                onChange={(e) => setCheckoutAddress(e.target.value)}
                placeholder="Street, building, floor and apartment"
              />
            </label>
            <label>
              ORDER NOTES <span>OPTIONAL</span>
              <textarea
                rows={2}
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Anything the delivery team should know"
              />
            </label>
            <div className="checkout-form-head">
              <small>02 / PAYMENT</small>
              <span>CASH ON DELIVERY</span>
            </div>
            <div className="checkout-payment-option">
              <b>CASH ON DELIVERY</b>
              <span>Pay when your order arrives. No card details are collected by STREET.</span>
            </div>
            <button
              className="solid checkout-submit"
              type="submit"
              disabled={checkoutBusy || checkoutShipping === null}
            >
              {checkoutBusy ? 'PLACING ORDER…' : 'PLACE ORDER ↗'}
            </button>
            {checkoutNotice && (
              <p className="checkout-notice" role="status">
                {checkoutNotice}
              </p>
            )}
            {checkoutShipping === null && (
              <p className="checkout-notice">
                DELIVERY FEE IS NOT CONFIGURED YET. PLEASE CONTACT THE STORE.
              </p>
            )}
          </form>
          <aside className="checkout-summary">
            <div className="checkout-form-head">
              <small>03 / YOUR BAG</small>
              <span>{cartCount} PIECES</span>
            </div>
            {cart.map((item) => (
              <div className="checkout-line" key={item.product.id + item.size}>
                <Img src={item.product.images[0]} alt={item.product.name} />
                <span>
                  {item.product.name}
                  <small>
                    {item.size} × {item.qty}
                  </small>
                </span>
                <b>{money(item.product.price * item.qty)}</b>
              </div>
            ))}
            <div className="checkout-coupon">
              <label htmlFor="checkout-coupon">DISCOUNT CODE</label>
              <div>
                <input
                  id="checkout-coupon"
                  value={checkoutCoupon}
                  onChange={(e) => {
                    setCheckoutCoupon(e.target.value.toUpperCase())
                    setCheckoutCouponCode('')
                    setCheckoutDiscount(0)
                    setCheckoutNotice('')
                  }}
                  placeholder="ENTER CODE"
                />
                <button type="button" onClick={() => void applyCheckoutCoupon()}>
                  APPLY
                </button>
              </div>
            </div>
            <div className="checkout-totals">
              <p>
                <span>SUBTOTAL</span>
                <b>{money(subtotal)}</b>
              </p>
              <p>
                <span>DISCOUNT {checkoutCouponCode && <i>{checkoutCouponCode}</i>}</span>
                <b>− {moneyValue(checkoutDiscount)}</b>
              </p>
              <p>
                <span>DELIVERY</span>
                <b>{checkoutShipping === null ? 'TO BE CONFIRMED' : moneyValue(checkoutShipping)}</b>
              </p>
              <footer>
                <span>TOTAL</span>
                <strong>{money(checkoutTotal)}</strong>
              </footer>
            </div>
            {checkoutNotice && (
              <p className="checkout-notice" role="status">
                {checkoutNotice}
              </p>
            )}
          </aside>
        </div>
      )}
      {footer}
    </main>
  )
}
