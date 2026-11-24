export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']

export const CATEGORIES = [
  'PANTS',
  'JACKETS',
  'HOODIES',
  'T-SHIRTS',
  'CAPS',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  sizes: string[]
  soldOut?: boolean
  stockBySize?: Record<string, number>
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
  sizes: category === 'PANTS' ? ['30', '32', '34', '36', '38', '40', '42'] : ['S', 'M', 'L', 'XL'],
  images,
  details: [
    'Product details and fabric information will be updated.',
    'Please check the available sizes before ordering.',
  ],
})

const numberedImages = (folder: string, number: number, count: number) =>
  Array.from({ length: count }, (_, index) => `/products/${folder}/${number}-${index + 1}.webp`)

const jacketProducts = [1, 2, 3].map((number) => ({
  code: String(number).padStart(2, '0'),
  images: numberedImages('jackets', number, 6),
}))

const tshirtProducts = [1, 2].map((number) => ({
  code: String(number).padStart(2, '0'),
  images: numberedImages('t-shirts', number, number === 1 ? 5 : 6),
}))

const capProducts = [1, 2, 3].map((number) => ({
  code: String(number).padStart(2, '0'),
  images: numberedImages('caps', number, number === 2 ? 4 : 3),
}))

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
  ...capProducts.map(({ code, images }, index) =>
    product(`cap-${code}`, `CAP ${String(index + 1).padStart(2, '0')}`, 'CAPS', '#292929', images),
  ),
]

export const OUTFIT_IDS: string[] = ['pant-02', 'hoodie-01']
