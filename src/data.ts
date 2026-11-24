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

const BASE_DETAILS = [
  'Relaxed fit',
  'Heavyweight 430gsm cotton blend fleece',
  'Ribbed cuffs and hem',
  'Unisex',
  'Material: 75% cotton / 25% polyester',
  'Imported',
]

const mk = (
  id: string,
  name: string,
  category: Category,
  price: number,
  sizes: string[] = SIZES,
  soldOut = false,
  color = '#1b1a8a',
): Product => ({ id, name, category, price, sizes, soldOut, color, images: ['', ''], details: BASE_DETAILS })

export const PRODUCTS: Product[] = [
  mk('snakeskin-zip', 'SNAKESKIN ZIP HOODIE', 'ZIP-UPS', 160),
  mk('snakeskin-zip-2', 'SNAKESKIN ZIP HOODIE', 'ZIP-UPS', 160),
  mk('plaid-zip', 'PLAID LINED ZIP HOODIE', 'ZIP-UPS', 180),
  mk('plaid-zip-2', 'PLAID LINED ZIP HOODIE', 'ZIP-UPS', 180, SIZES, true),
  mk('canvas-backpack', 'CANVAS BACKPACK', 'ACCESSORIES', 95, ['ONE SIZE']),
  mk('canvas-backpack-2', 'CANVAS BACKPACK', 'ACCESSORIES', 95, ['ONE SIZE']),
  mk('canvas-pouch', 'CANVAS POUCH', 'ACCESSORIES', 60, ['ONE SIZE'], true),
  mk('canvas-pouch-2', 'CANVAS POUCH', 'ACCESSORIES', 60, ['ONE SIZE']),
  mk('jersey-short', 'JERSEY SHORT', 'BOTTOMS', 90, ['XS', 'S', 'M', 'L']),
  mk('dice-clock-tee', 'DICE CLOCK TEE', 'TEES', 50, ['S', 'M', 'L', 'XL', '2XL']),
  mk('basic-crew', 'BASIC CREW', 'CREWS', 140, ['S', 'M', 'XL', '2XL']),
  mk('crew-sock', 'ATHLETIC CREW SOCK', 'ACCESSORIES', 15, ['ONE SIZE']),
  mk('swirly-cap', '59FIFTY SWIRLY S CAP', 'HEADWEAR', 60, ['ONE SIZE']),
  mk('swirly-cap-2', '59FIFTY SWIRLY S CAP', 'HEADWEAR', 55, ['ONE SIZE']),
  mk('swirly-cap-3', '59FIFTY SWIRLY S CAP', 'HEADWEAR', 60, ['ONE SIZE'], true),
  mk('work-denim', 'WORK JEAN', 'DENIM', 150, ['S', 'M', 'L', 'XL']),
  mk('chunky-knit', 'CHUNKY KNIT SWEATER', 'KNITS', 175, ['S', 'M', 'L', 'XL']),
  mk('shell-jacket', 'SHELL JACKET', 'OUTERWEAR', 260, ['S', 'M', 'L', 'XL']),
  mk('pullover-hoodie', 'PULLOVER HOODIE', 'HOODIES', 145, SIZES),
]

export const OUTFIT_IDS = ['swirly-cap', 'dice-clock-tee', 'basic-crew', 'canvas-pouch-2']
