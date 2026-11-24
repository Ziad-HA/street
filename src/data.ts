export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']

export const CATEGORIES = [
  'BOTTOMS',
  'LAYERING',
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

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=85`

function demoProduct(
  id: string,
  name: string,
  category: Category,
  price: number,
  color: string,
  image: string,
  sizes: string[] = ['S', 'M', 'L', 'XL'],
): Product {
  return {
    id, name, category, price, color, sizes,
    images: [photo(image)],
    isDemo: true,
    details: [
      'DEMO ITEM — NOT FOR SALE',
      'This is a temporary catalogue example. Product specifications, fabric, fit and measurements are not verified.',
      'Replace this demo entry with your real product information before accepting orders.',
    ],
  }
}

// Temporary visual catalogue only. These examples are not real stock and cannot be purchased.
export const PRODUCTS: Product[] = [
  demoProduct('demo-cargo-pant', 'RELAXED CARGO PANT', 'BOTTOMS', 58, '#77766c', 'photo-1515886657613-9f3515b0c78f'),
  demoProduct('demo-track-pant', 'WIDE TRACK PANT', 'BOTTOMS', 49, '#292929', 'photo-1552902865-b72c031ac5ea'),
  demoProduct('demo-denim-blue', 'RELAXED BLUE DENIM', 'BOTTOMS', 64, '#52677a', 'photo-1542272604-787c3835535d'),
  demoProduct('demo-denim-black', 'WASHED BLACK DENIM', 'BOTTOMS', 68, '#292929', 'photo-1541099649105-f69ad21f3246'),
  demoProduct('demo-denim-wide', 'WIDE LEG DENIM', 'BOTTOMS', 66, '#7a8791', 'photo-1511196044526-5cb3bcb7071b'),
  demoProduct('demo-hoodie-black', 'OVERSIZED CORE HOODIE', 'LAYERING', 72, '#202020', 'photo-1556821840-3a63f95609a7'),
  demoProduct('demo-hoodie-grey', 'HEAVYWEIGHT HOODIE', 'LAYERING', 78, '#888888', 'photo-1556821846-1a6e7e7e9f9d'),
  demoProduct('demo-hoodie-cream', 'BOXY FLEECE HOODIE', 'LAYERING', 74, '#d7cdbd', 'photo-1578681994506-b8f463449011'),
  demoProduct('demo-zip-black', 'CORE ZIP HOODIE', 'LAYERING', 82, '#242424', 'photo-1556821840-3a63f95609a7'),
  demoProduct('demo-zip-grey', 'WASHED ZIP-UP', 'LAYERING', 86, '#8b8984', 'photo-1556821846-1a6e7e7e?'),
  demoProduct('demo-zip-cream', 'BOXY ZIP JACKET', 'LAYERING', 84, '#d8d0c1', 'photo-1578681994506-b8f463449011'),
]

export const OUTFIT_IDS: string[] = ['demo-tee-white', 'demo-denim-blue', 'demo-cap-black']
