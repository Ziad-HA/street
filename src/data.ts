export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']

export const CATEGORIES = [
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
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  sizes: string[]
  soldOut?: boolean
  color: string
  /** روابط صور المنتج (فاضية = خانة رمادية). الصورة الأولى هي الرئيسية */
  images: string[]
  details: string[]
}

// Add verified product records here before launch. No sample products are shown to customers.
export const PRODUCTS: Product[] = []

export const OUTFIT_IDS: string[] = []
