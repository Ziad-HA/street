import type { Category, Product } from './data'

export type Page =
  | 'intro'
  | 'hero'
  | 'store'
  | 'collections'
  | 'collection'
  | 'product'
  | 'studio'
  | 'contact'
  | 'help'
  | 'wishlist'
  | 'track'
  | 'new-arrivals'
  | 'best-sellers'
  | 'lookbook'
  | 'build-outfit'
  | 'size-guide'
  | 'checkout'
  | 'account'
  | 'admin'
  | 'purchase-terms'
  | 'style-terms'
  | 'privacy'
  | 'cookies'
  | 'ai-terms'
  | 'sitemap'
  | 'cookie-settings'
  | 'market-language'

export interface CartItem {
  product: Product
  size: string
  qty: number
}

export const NAV: { label: string; page: Page }[] = [
  { label: 'HOME', page: 'hero' },
  { label: 'SHOP', page: 'store' },
  { label: 'COLLECTIONS', page: 'collections' },
  { label: 'STUDIO', page: 'studio' },
  { label: 'CONTACT', page: 'contact' },
]

export const LEGAL_PAGES: Page[] = [
  'purchase-terms',
  'style-terms',
  'privacy',
  'cookies',
  'ai-terms',
  'sitemap',
  'cookie-settings',
  'market-language',
]

export interface RouteState {
  page: Page
  category?: Category
  product?: Product
}
