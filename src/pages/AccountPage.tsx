import { useEffect, useState } from 'react'
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react'
import { supabase } from '../lib/supabase'
import { money } from '../utils/format'

interface AccountOrder {
  order_number: string
  total: number
  status: string
  created_at: string
}

export default function AccountPage({
  setWish,
  footer,
}: {
  setWish: Dispatch<SetStateAction<string[]>>
  footer: ReactNode
}) {
  const [accountMode, setAccountMode] = useState<'signin' | 'signup'>('signin')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountUser, setAccountUser] = useState<string | null>(null)
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>([])
  const [accountNotice, setAccountNotice] = useState('')

  useEffect(() => {
    let alive = true
    const loadAccount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!alive) return
      setAccountUser(session?.user.email ?? null)
      if (!session?.user) return
      const { data: orders } = await supabase
        .from('orders')
        .select('order_number,total,status,created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (alive) setAccountOrders(orders ?? [])
      const { data: saved } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', session.user.id)
      if (alive && saved) setWish(saved.map((item) => item.product_id))
    }
    void loadAccount()
    return () => {
      alive = false
    }
  }, [setWish])

  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAccountNotice('PLEASE WAIT…')
    if (accountMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: accountEmail.trim(),
        password: accountPassword,
        options: {
          data: { full_name: accountName.trim() },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        setAccountNotice(error.message)
        return
      }
      if (data.session) {
        setAccountUser(data.user?.email ?? null)
        setAccountNotice('ACCOUNT CREATED.')
      } else {
        setAccountNotice('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT, THEN SIGN IN.')
      }
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: accountEmail.trim(),
      password: accountPassword,
    })
    if (error || !data.user) {
      setAccountNotice(error?.message ?? 'Unable to sign in.')
      return
    }
    setAccountUser(data.user.email ?? null)
    const { data: orders } = await supabase
      .from('orders')
      .select('order_number,total,status,created_at')
      .eq('user_id', data.user.id)
      .order('created_at', { ascending: false })
    setAccountOrders(orders ?? [])
    const { data: saved } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', data.user.id)
    if (saved) setWish(saved.map((item) => item.product_id))
    setAccountNotice('SIGNED IN.')
  }

  const resendAccountConfirmation = async () => {
    if (!accountEmail.trim()) {
      setAccountNotice('ENTER YOUR EMAIL ADDRESS FIRST.')
      return
    }
    setAccountNotice('SENDING A NEW CONFIRMATION EMAIL…')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: accountEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setAccountNotice(
      error
        ? error.message
        : 'A NEW CONFIRMATION EMAIL HAS BEEN SENT. USE THE LATEST EMAIL ONLY.',
    )
  }

  const signOutAccount = async () => {
    await supabase.auth.signOut()
    setAccountUser(null)
    setAccountOrders([])
    setAccountNotice('SIGNED OUT.')
  }

  return (
    <main id="main-content" className="utility-page account-page">
      <div className="page-kicker">STREET / YOUR ACCOUNT / 011</div>
      <div className="utility-heading">
        <small>YOUR STREET PROFILE</small>
        <h1>
          YOUR
          <br />
          <span>ACCOUNT.</span>
        </h1>
        <p>
          Sign in to view your account and order history, or create an account for your next STREET
          order.
        </p>
      </div>
      {!accountUser ? (
        <form className="admin-login" onSubmit={submitAccount}>
          <div className="account-mode">
            <button
              type="button"
              className={accountMode === 'signin' ? 'on' : ''}
              onClick={() => {
                setAccountMode('signin')
                setAccountNotice('')
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              className={accountMode === 'signup' ? 'on' : ''}
              onClick={() => {
                setAccountMode('signup')
                setAccountNotice('')
              }}
            >
              CREATE ACCOUNT
            </button>
          </div>
          {accountMode === 'signup' && (
            <>
              <label>FULL NAME</label>
              <input
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Your name"
              />
            </>
          )}
          <label>EMAIL</label>
          <input
            type="email"
            required
            value={accountEmail}
            onChange={(e) => setAccountEmail(e.target.value)}
            placeholder="name@domain.com"
          />
          <label>PASSWORD</label>
          <input
            type="password"
            required
            minLength={6}
            value={accountPassword}
            onChange={(e) => setAccountPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <button className="solid" type="submit">
            {accountMode === 'signup' ? 'CREATE ACCOUNT ↗' : 'SIGN IN ↗'}
          </button>
          {accountNotice && <p>{accountNotice}</p>}
          {accountMode === 'signin' && (
            <button
              type="button"
              className="text-button"
              onClick={() => void resendAccountConfirmation()}
            >
              RESEND CONFIRMATION EMAIL ↗
            </button>
          )}
        </form>
      ) : (
        <section className="account-orders">
          <div>
            <h2>WELCOME BACK</h2>
            <span>{accountUser}</span>
            <button onClick={() => void signOutAccount()}>SIGN OUT</button>
          </div>
          <h3>YOUR ORDERS</h3>
          {accountOrders.length === 0 ? (
            <p>NO ORDERS LINKED TO THIS ACCOUNT YET.</p>
          ) : (
            accountOrders.map((o) => (
              <article key={o.order_number}>
                <b>{o.order_number}</b>
                <span>{o.status.toUpperCase()}</span>
                <strong>{money(Number(o.total))}</strong>
                <small>{new Date(o.created_at).toLocaleDateString()}</small>
              </article>
            ))
          )}
        </section>
      )}
      {footer}
    </main>
  )
}
