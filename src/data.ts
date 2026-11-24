export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']

export const CATEGORIES = [
  'PANTS',
  'HOODIES',
  'JACKETS',
  'T-SHIRTS',
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
  images: string[]
  details: string[]
  isDemo?: boolean
}

const localProduct = (
  id: string,
  name: string,
  category: Category,
  price: number,
  color: string,
  images: string[],
): Product => ({
  id,
  name,
  category,
  price,
  color,
  sizes: ['S', 'M', 'L', 'XL'],
  images,
  isDemo: true,
  details: [
    'DEMO ITEM — NOT FOR SALE',
    'Product photos are connected. Add confirmed product details, pricing and stock before accepting orders.',
  ],
})

const pantImages = (number: number) =>
  [1, 2, 3, 4].map((view) => `/products/pants/${number}-${view}.webp`)

const hoodieImages = [1, 2, 3].map((view) => `/products/hoodies/1-${view}.webp`)

// Uploaded product photos are grouped by their leading product number.
export const PRODUCTS: Product[] = [
  localProduct('pant-01', 'PANT 01', 'PANTS', 58, '#77766c', pantImages(1)),
  localProduct('pant-02', 'PANT 02', 'PANTS', 64, '#52677a', pantImages(2)),
  localProduct('pant-03', 'PANT 03', 'PANTS', 68, '#292929', pantImages(3)),
  localProduct('hoodie-01', 'HOODIE 01', 'HOODIES', 72, '#202020', hoodieImages),
]

export const OUTFIT_IDS: string[] = ['pant-02', 'hoodie-01']
