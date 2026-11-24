import { CATEGORIES, PRODUCTS } from '../data'
import type { Category, Product } from '../data'
import { LEGAL_PAGES } from '../types'
import type { Page, RouteState } from '../types'

const UTILITY_PAGES: Page[] = [
  'new-arrivals',
  'best-sellers',
  'lookbook',
  'build-outfit',
  'size-guide',
  'checkout',
  'account',
  'admin',
]

export function routeFromLocation(): RouteState {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'shop') return { page: 'store' }
  if (parts[0] === 'collections' && parts[1]) {
    const category = CATEGORIES.find(
      (item) => item.toLowerCase() === decodeURIComponent(parts[1]).toLowerCase(),
    )
    return category ? { page: 'collection', category } : { page: 'collections' }
  }
  if (parts[0] === 'collections') return { page: 'collections' }
  if (parts[0] === 'product' && parts[1]) {
    const id = decodeURIComponent(parts[1])
    const product = PRODUCTS.find((item) => item.id === id)
    if (product) return { page: 'product', product, category: product.category }
    const category =
      CATEGORIES.find((item) => id.startsWith(`${item.toLowerCase().replace(/\s+/g, '-')}-`)) ??
      'HOODIES'
    const placeholder: Product = {
      id,
      name: 'PRODUCT DETAILS',
      category,
      price: 0,
      sizes: [],
      images: [],
      color: '#292929',
      details: [],
    }
    return { page: 'product', product: placeholder, category }
  }
  if (parts[0] === 'studio') return { page: 'studio' }
  if (parts[0] === 'contact') return { page: 'contact' }
  if (parts[0] === 'help') return { page: 'help' }
  if (LEGAL_PAGES.includes(parts[0] as Page)) return { page: parts[0] as Page }
  if (parts[0] === 'wishlist') return { page: 'wishlist' }
  if (parts[0] === 'track') return { page: 'track' }
  if (UTILITY_PAGES.includes(parts[0] as Page)) return { page: parts[0] as Page }
  if (parts.length === 0) {
    try {
      return { page: localStorage.getItem('street-intro-seen-v1') === '1' ? 'hero' : 'intro' }
    } catch {
      return { page: 'intro' }
    }
  }
  return { page: 'hero' }
}

export function pathForPage(page: Page, category?: Category): string {
  if (page === 'hero' || page === 'intro') return '/'
  if (page === 'store') return '/shop'
  if (page === 'collections') return '/collections'
  if (page === 'collection') {
    return category ? `/collections/${encodeURIComponent(category.toLowerCase())}` : '/collections'
  }
  return `/${page}`
}
