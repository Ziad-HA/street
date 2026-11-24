import type { Category, Product } from '../data'

export const PRICE_RANGES: Record<Category, { min: number; max: number; default: number }> = {
  JACKETS: { min: 2000, max: 3200, default: 2790 },
  PANTS: { min: 900, max: 1800, default: 1290 },
  'T-SHIRTS': { min: 800, max: 1500, default: 990 },
  HOODIES: { min: 1200, max: 1700, default: 1490 },
  CAPS: { min: 200, max: 600, default: 390 },
}

export const money = (n: number) =>
  n > 0 ? `EGP ${Math.round(n).toLocaleString('en-EG')}` : 'PRICE UNAVAILABLE'

export const moneyValue = (n: number) => `EGP ${Math.round(n).toLocaleString('en-EG')}`

export const defaultPriceFor = (category: Category) => PRICE_RANGES[category].default

export const categoryLabel = (c: Category) =>
  ({ PANTS: 'PANTS', JACKETS: 'JACKETS', HOODIES: 'HOODIES', 'T-SHIRTS': 'T-SHIRTS', CAPS: 'CAPS' })[c]

export const EMPTY_PRODUCT: Product = {
  id: '',
  name: 'PRODUCT DETAILS',
  category: 'HOODIES',
  price: 0,
  sizes: [],
  color: '#eeeeee',
  images: [],
  details: [],
}

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
