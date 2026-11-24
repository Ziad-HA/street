import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Page } from '../types'
import { readStored } from '../utils/format'

const TITLES: Record<string, string> = {
  'purchase-terms': 'TERMS OF PURCHASE',
  'style-terms': '#STREETSTYLE',
  privacy: 'PRIVACY POLICY',
  cookies: 'COOKIES POLICY',
  'ai-terms': 'USE OF AI',
  sitemap: 'SITEMAP',
  'cookie-settings': 'COOKIE SETTINGS',
  'market-language': 'MARKET & LANGUAGE',
}

export default function LegalPages({ page, footer }: { page: Page; footer: ReactNode }) {
  const [cookiePrefs, setCookiePrefs] = useState(() =>
    readStored<{ analytics: boolean; marketing: boolean }>('street-cookie-preferences-v1', {
      analytics: false,
      marketing: false,
    }),
  )
  const [cookieSaved, setCookieSaved] = useState(false)

  return (
    <main id="main-content" className="utility-page legal-page">
      <div className="utility-heading">
        <small>STREET / INFORMATION</small>
        <h1>{TITLES[page]}</h1>
        <p>EGYPT · ENGLISH · LAST UPDATED 24 NOVEMBER 2026</p>
      </div>
      {page === 'purchase-terms' && (
        <section className="legal-copy">
          <div className="legal-notice">
            DRAFT STORE TERMS — Please have these terms reviewed for your business and applicable
            Egyptian consumer and e-commerce requirements before publishing as final legal terms.
          </div>
          <article>
            <h2>01 / ABOUT THESE TERMS</h2>
            <p>
              These terms explain how orders are placed through STREET&apos;s online store. By
              submitting an order, you confirm that the information you provide is accurate and that
              you have read these terms.
            </p>
          </article>
          <article>
            <h2>02 / PRODUCTS AND AVAILABILITY</h2>
            <p>
              We aim to show product images, descriptions, colours and sizes as accurately as
              possible. Display colours may vary between screens. Product availability is based on
              the live size-level stock shown on the website and is checked again when an order is
              submitted. Adding an item to your bag does not reserve it.
            </p>
          </article>
          <article>
            <h2>03 / PRICES AND PAYMENT</h2>
            <p>
              Prices are displayed in Egyptian pounds (EGP). The delivery fee and any discount are
              shown in the checkout summary before you place your order. Cash on delivery is the
              payment method currently supported by STREET. Do not send payment-card details
              through website forms or messages.
            </p>
          </article>
          <article>
            <h2>04 / PLACING AN ORDER</h2>
            <p>
              When you submit checkout, you are sending an order request. STREET checks the product,
              selected size, price and available stock before creating the order. An on-screen order
              confirmation means the order has been recorded by the store; if we cannot fulfil it,
              we will use the contact details supplied to discuss the next step.
            </p>
          </article>
          <article>
            <h2>05 / DELIVERY</h2>
            <p>
              Available delivery options and the applicable fee are displayed at checkout. Delivery
              timing may depend on the destination and courier arrangements. If an order is delayed,
              the store should provide an update using the contact details on the order.
            </p>
          </article>
          <article>
            <h2>06 / CANCELLATIONS, RETURNS AND EXCHANGES</h2>
            <p>
              STREET&apos;s detailed cancellation, return and exchange procedure has not yet been
              configured on this website. Please contact the store before ordering if you need to
              confirm eligibility or process. Nothing in these draft terms is intended to remove any
              rights that cannot legally be excluded.
            </p>
          </article>
          <article>
            <h2>07 / ACCOUNT AND WEBSITE USE</h2>
            <p>
              You can place an order as a guest without creating an account. If you sign in, your
              order can be linked to your account; guest orders are not added to an account order
              history. Please provide accurate delivery and contact details. Do not misuse the
              website, attempt unauthorised access, interfere with its operation or submit unlawful
              content.
            </p>
          </article>
          <article>
            <h2>08 / CONTACT AND CHANGES</h2>
            <p>
              For order questions, use the Contact or Help pages on this website. STREET may update
              product information and these terms when store operations change. The version displayed
              on this page is the version currently presented by the website.
            </p>
          </article>
        </section>
      )}
      {page === 'style-terms' && (
        <section className="legal-copy">
          <div className="legal-notice">
            Community guidelines for any future STREET hashtag or repost campaign. No public
            submission or repost campaign is currently promised by this page.
          </div>
          <article>
            <h2>01 / YOUR CONTENT</h2>
            <p>
              Only share photos, videos and captions that you created or have permission to use. Do
              not post another person&apos;s image, artwork, music or other protected material
              without permission.
            </p>
          </article>
          <article>
            <h2>02 / PERMISSION TO REPOST</h2>
            <p>
              Using a STREET hashtag by itself does not transfer ownership of your content or
              automatically grant STREET permission to publish it. If STREET asks to repost your
              content, we will request clear permission and explain the intended use before
              publication.
            </p>
          </article>
          <article>
            <h2>03 / COMMUNITY STANDARDS</h2>
            <p>
              Do not submit content that is unlawful, misleading, discriminatory, harassing,
              explicit, dangerous, or that exposes another person&apos;s private information. Do not
              impersonate STREET or suggest that you are officially affiliated with the brand.
            </p>
          </article>
          <article>
            <h2>04 / YOUR RIGHTS</h2>
            <p>
              You keep ownership of content you create. You can withdraw permission for a future
              repost by contacting STREET through the website&apos;s Contact page. This may not
              remove copies already shared by other users or platforms.
            </p>
          </article>
        </section>
      )}
      {page === 'privacy' && (
        <section className="legal-copy">
          <div className="legal-notice">
            This is a plain-language draft based on the features currently visible in the STREET
            store. Confirm the legal business identity, contact details, retention periods and
            service-provider list before launch.
          </div>
          <article>
            <h2>01 / INFORMATION WE HANDLE</h2>
            <p>
              Depending on how you use the store, information may include your account email and
              profile name; order name, phone number, delivery address, city and order notes;
              products, sizes and quantities ordered; and support messages you choose to send.
            </p>
          </article>
          <article>
            <h2>02 / WHY WE USE IT</h2>
            <p>
              We use order information to process purchases, check stock, arrange delivery, provide
              order history and respond to support requests. Account information is used to sign you
              in and maintain your account. Cart, wishlist and basic experience preferences may be
              stored in your browser.
            </p>
          </article>
          <article>
            <h2>03 / SERVICE PROVIDERS</h2>
            <p>
              The store uses third-party infrastructure for hosting, authentication and database
              services, including Supabase and the website hosting provider. Those providers may
              process information as needed to operate the service. Delivery information may need to
              be shared with a courier when an order is fulfilled.
            </p>
          </article>
          <article>
            <h2>04 / SHARING AND SECURITY</h2>
            <p>
              STREET does not offer customer information for sale. Access to order and account
              information should be limited to people who need it to operate the store. Online
              services cannot guarantee absolute security, so please use a unique password and
              avoid sending sensitive information in order notes.
            </p>
          </article>
          <article>
            <h2>05 / STORAGE AND YOUR CHOICES</h2>
            <p>
              Information is kept for as long as needed to operate the store, meet applicable
              obligations and resolve order issues. Specific retention periods and a formal privacy
              contact must be confirmed by the store owner. You may request access, correction or
              deletion where applicable by using the Contact page.
            </p>
          </article>
          <article>
            <h2>06 / CHILDREN AND UPDATES</h2>
            <p>
              The store is not designed to knowingly collect personal information from children
              without appropriate permission. This policy may be updated as store features and legal
              requirements change.
            </p>
          </article>
        </section>
      )}
      {page === 'cookies' && (
        <section className="legal-copy">
          <article>
            <h2>01 / BROWSER STORAGE</h2>
            <p>
              STREET uses essential browser storage to keep core store features working, such as your
              shopping bag, wishlist, intro preference and sign-in session. Some of this storage may
              be local storage or session storage rather than traditional cookies.
            </p>
          </article>
          <article>
            <h2>02 / OPTIONAL TRACKING</h2>
            <p>
              This version of the store does not intentionally enable optional advertising or
              analytics trackers. If optional tools are added later, this page and Cookie Settings
              should be updated and consent collected where required.
            </p>
          </article>
          <article>
            <h2>03 / MANAGING YOUR CHOICES</h2>
            <p>
              You can review the current preference controls through Cookie Settings. Blocking
              essential browser storage may affect sign-in, the shopping bag, wishlist and other
              store features.
            </p>
          </article>
        </section>
      )}
      {page === 'ai-terms' && (
        <section className="legal-copy">
          <article>
            <h2>01 / CURRENT EXPERIENCE</h2>
            <p>
              STREET&apos;s shopping experience is based on product information entered by the store
              and the stock and order systems connected to the website. This page does not represent
              that a customer-facing generative AI feature is currently available.
            </p>
          </article>
          <article>
            <h2>02 / FUTURE AI-ASSISTED FEATURES</h2>
            <p>
              If STREET introduces AI-assisted search, styling, support or content features, the
              store should explain what the feature does, what information it uses and where human
              review is available before the feature is launched.
            </p>
          </article>
          <article>
            <h2>03 / IMPORTANT LIMITS</h2>
            <p>
              Any future AI-generated suggestions should be treated as general assistance, not a
              guarantee of product fit, availability, delivery timing or professional advice. Product
              specifications and order confirmations shown by the store remain the reference for
              purchases.
            </p>
          </article>
        </section>
      )}
      {page === 'sitemap' && (
        <section className="legal-sitemap">
          {(
            [
              [
                'SHOP',
                [
                  ['Shop all', '/shop'],
                  ['Collections', '/collections'],
                  ['New arrivals', '/new-arrivals'],
                  ['Best sellers', '/best-sellers'],
                  ['Lookbook', '/lookbook'],
                  ['Build your outfit', '/build-outfit'],
                  ['Size guide', '/size-guide'],
                ],
              ],
              [
                'YOUR ACCOUNT',
                [
                  ['Account', '/account'],
                  ['Wishlist', '/wishlist'],
                  ['Order tracking', '/track'],
                  ['Checkout', '/checkout'],
                ],
              ],
              [
                'SUPPORT',
                [
                  ['Help & FAQs', '/help'],
                  ['Contact', '/contact'],
                  ['Studio', '/studio'],
                ],
              ],
              [
                'LEGAL & SETTINGS',
                [
                  ['Terms of purchase', '/purchase-terms'],
                  ['#STREETSTYLE terms', '/style-terms'],
                  ['Privacy policy', '/privacy'],
                  ['Cookies policy', '/cookies'],
                  ['Cookie settings', '/cookie-settings'],
                  ['Use of AI', '/ai-terms'],
                  ['Market & language', '/market-language'],
                ],
              ],
            ] as [string, string[][]][]
          ).map(([heading, items]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              {items.map(([label, path]) => (
                <a key={path} href={path}>
                  {label}
                  <span>↗</span>
                </a>
              ))}
            </section>
          ))}
        </section>
      )}
      {page === 'cookie-settings' && (
        <section className="legal-copy cookie-settings-panel">
          <p>
            Essential storage is always active because it supports sign-in, your shopping bag and
            basic store functions. Optional categories are currently off by default.
          </p>
          <div className="cookie-option">
            <div>
              <b>ESSENTIAL</b>
              <small>Required for core store functionality. Always active.</small>
            </div>
            <input type="checkbox" checked disabled aria-label="Essential storage always active" />
          </div>
          <div className="cookie-option">
            <div>
              <b>ANALYTICS</b>
              <small>Would help understand aggregate site usage if an analytics service is added.</small>
            </div>
            <input
              type="checkbox"
              checked={cookiePrefs.analytics}
              onChange={(e) => {
                setCookiePrefs((p) => ({ ...p, analytics: e.target.checked }))
                setCookieSaved(false)
              }}
              aria-label="Analytics preference"
            />
          </div>
          <div className="cookie-option">
            <div>
              <b>MARKETING</b>
              <small>
                Would be used for advertising measurement or personalised marketing if such tools are
                added.
              </small>
            </div>
            <input
              type="checkbox"
              checked={cookiePrefs.marketing}
              onChange={(e) => {
                setCookiePrefs((p) => ({ ...p, marketing: e.target.checked }))
                setCookieSaved(false)
              }}
              aria-label="Marketing preference"
            />
          </div>
          <button
            className="legal-save-button"
            onClick={() => {
              localStorage.setItem('street-cookie-preferences-v1', JSON.stringify(cookiePrefs))
              setCookieSaved(true)
            }}
          >
            SAVE MY PREFERENCES ↗
          </button>
          {cookieSaved && (
            <p className="legal-saved" role="status">
              YOUR PREFERENCES HAVE BEEN SAVED ON THIS DEVICE.
            </p>
          )}
        </section>
      )}
      {page === 'market-language' && (
        <section className="legal-copy market-panel">
          <div className="market-current">
            <small>CURRENT STORE REGION</small>
            <b>EGYPT</b>
            <span>EGP / ENGLISH</span>
          </div>
          <p>
            STREET currently serves the Egypt storefront in English. Additional markets, currencies
            and translated storefronts are not available yet.
          </p>
          <label>
            MARKET
            <select value="EG" disabled>
              <option value="EG">Egypt</option>
            </select>
          </label>
          <label>
            LANGUAGE
            <select value="en" disabled>
              <option value="en">English</option>
            </select>
          </label>
        </section>
      )}
      {footer}
    </main>
  )
}
