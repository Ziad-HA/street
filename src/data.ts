export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']

export const CATEGORIES = [
  'PANTS',
  'JACKETS',
  'HOODIES',
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
}

const product = (
  id: string,
  name: string,
  category: Category,
  color: string,
  images: string[],
): Product => ({
  id,
  name,
  category,
  price: 0,
  color,
  sizes: ['S', 'M', 'L', 'XL'],
  images,
  details: [
    'Product details and fabric information will be updated.',
    'Please check the available sizes before ordering.',
  ],
})

const numberedImages = (folder: string, number: number, count: number) =>
  Array.from({ length: count }, (_, index) => `/products/${folder}/${number}-${index + 1}.webp`)

const filesByProduct = (folder: string, filenames: string[]) => {
  const grouped = new Map<string, string[]>()
  filenames.forEach((filename) => {
    const code = filename.replace(/-(?:a\\d+[a-z]|b|p)\\.webp$/i, '')
    const current = grouped.get(code) ?? []
    current.push(`/products/${folder}/${filename}`)
    grouped.set(code, current)
  })
  return Array.from(grouped.entries()).map(([code, images]) => ({
    code,
    images: images.sort((a, b) => a.localeCompare(b)),
  }))
}

const jacketProducts = filesByProduct('jackets', [
  '02152046800-a1t.webp',
  '02152046800-a2d.webp',
  '02152046800-a3o.webp',
  '02152046800-a4o.webp',
  '02152046800-b.webp',
  '02152046800-p.webp',
  '02162551462-a1t.webp',
  '02162551462-a3o.webp',
  '02162551462-a4o.webp',
  '02162551462-a5o.webp',
  '02162551462-b.webp',
  '02162551462-p.webp',
  '03099273501-a1t.webp',
  '03099273501-a2d.webp',
  '03099273501-a3o.webp',
  '03099273501-a4o.webp',
  '03099273501-b.webp',
  '03099273501-p.webp',
])

const tshirtProducts = filesByProduct('t-shirts', [
  '00069154250-a1t.webp',
  '00069154250-a2d.webp',
  '00069154250-a4o.webp',
  '00069154250-b.webp',
  '00069154250-p.webp',
  '03247120252-a1t.webp',
  '03247120252-a2d.webp',
  '03247120252-a3o.webp',
  '03247120252-a4o.webp',
  '03247120252-b.webp',
  '03247120252-p.webp',
])

export const PRODUCTS: Product[] = [
  product('pant-01', 'PANT 01', 'PANTS', '#77766c', numberedImages('pants', 1, 4)),
  product('pant-02', 'PANT 02', 'PANTS', '#52677a', numberedImages('pants', 2, 4)),
  product('pant-03', 'PANT 03', 'PANTS', '#292929', numberedImages('pants', 3, 4)),
  product('hoodie-01', 'HOODIE 01', 'HOODIES', '#202020', numberedImages('hoodies', 1, 3)),
  ...jacketProducts.map(({ code, images }, index) =>
    product(`jacket-${code}`, `JACKET ${String(index + 1).padStart(2, '0')}`, 'JACKETS', '#292929', images),
  ),
  ...tshirtProducts.map(({ code, images }, index) =>
    product(`tshirt-${code}`, `T-SHIRT ${String(index + 1).padStart(2, '0')}`, 'T-SHIRTS', '#eeeeee', images),
  ),
]

export const OUTFIT_IDS: string[] = ['pant-02', 'hoodie-01']
