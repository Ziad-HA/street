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
  // ACCESSORIES
  demoProduct('demo-crossbody', 'UTILITY CROSSBODY BAG', 'ACCESSORIES', 34, '#343434', 'photo-1553062407-98eeb64c6a62', ['ONE SIZE']),
  demoProduct('demo-canvas-tote', 'HEAVY CANVAS TOTE', 'ACCESSORIES', 22, '#d0c5ae', 'photo-1590870883013-3e5b4b6b8b3c', ['ONE SIZE']),
  demoProduct('demo-tech-pouch', 'DAILY TECH POUCH', 'ACCESSORIES', 28, '#55585c', 'photo-1544816155-12df9643f363', ['ONE SIZE']),

  // BOTTOMS
  demoProduct('demo-cargo-pant', 'RELAXED CARGO PANT', 'BOTTOMS', 58, '#77766c', 'photo-1515886657613-9f3515b0c78f'),
  demoProduct('demo-track-pant', 'WIDE TRACK PANT', 'BOTTOMS', 49, '#292929', 'photo-1552902865-b72c031ac5ea'),
  demoProduct('demo-short', 'UTILITY NYLON SHORT', 'BOTTOMS', 38, '#555c51', 'photo-1591195853828-11db59a44f6b'),

  // CREWS
  demoProduct('demo-crew-black', 'CORE CREW SWEATSHIRT', 'CREWS', 54, '#222222', 'photo-1578768079052-aa76e52ff62e'),
  demoProduct('demo-crew-grey', 'WASHED CREW SWEATSHIRT', 'CREWS', 56, '#aaa9a5', 'photo-1620799140408-edc6dcb6d633'),
  demoProduct('demo-crew-cream', 'BOX FIT CREW', 'CREWS', 52, '#d8d0c1', 'photo-1556821840-3a63f95609a7'),

  // DENIM
  demoProduct('demo-denim-blue', 'RELAXED BLUE DENIM', 'DENIM', 64, '#52677a', 'photo-1542272604-787c3835535d'),
  demoProduct('demo-denim-black', 'WASHED BLACK DENIM', 'DENIM', 68, '#292929', 'photo-1541099649105-f69ad21f3246'),
  demoProduct('demo-denim-wide', 'WIDE LEG DENIM', 'DENIM', 66, '#7a8791', 'photo-1511196044526-5cb3bcb7071b'),

  // HEADWEAR
  demoProduct('demo-cap-black', 'STREET LOGO CAP', 'HEADWEAR', 24, '#222222', 'photo-1588850561407-ed78c282e89b', ['ONE SIZE']),
  demoProduct('demo-beanie', 'RIB KNIT BEANIE', 'HEADWEAR', 26, '#55514b', 'photo-1576871337622-98d48d1cf531', ['ONE SIZE']),
  demoProduct('demo-cap-stone', 'UNSTRUCTURED 6-PANEL CAP', 'HEADWEAR', 25, '#b7aa94', 'photo-1521369909029-2afed882baee', ['ONE SIZE']),

  // HOODIES
  demoProduct('demo-hoodie-black', 'OVERSIZED CORE HOODIE', 'HOODIES', 72, '#202020', 'photo-1556821840-3a63f95609a7'),
  demoProduct('demo-hoodie-grey', 'HEAVYWEIGHT HOODIE', 'HOODIES', 78, '#888888', 'photo-1556821846-1a6e7e7e9f9d'),
  demoProduct('demo-hoodie-cream', 'BOXY FLEECE HOODIE', 'HOODIES', 74, '#d7cdbd', 'photo-1578681994506-b8f463449011'),

  // KNITS
  demoProduct('demo-knit-polo', 'TEXTURED KNIT POLO', 'KNITS', 62, '#a89c87', 'photo-1618354691373-d851c5c3a990'),
  demoProduct('demo-knit-cardigan', 'RELAXED KNIT CARDIGAN', 'KNITS', 76, '#77736b', 'photo-1610652492500-ded49ceeb378'),
  demoProduct('demo-knit-zip', 'KNIT ZIP TOP', 'KNITS', 69, '#373737', 'photo-1618354691373-d851c5c3a990'),

  // OUTERWEAR
  demoProduct('demo-bomber', 'UTILITY BOMBER JACKET', 'OUTERWEAR', 110, '#454a42', 'photo-1551028719-00167b16eac5'),
  demoProduct('demo-overshirt', 'HEAVY OVERSHIRT', 'OUTERWEAR', 88, '#9b8e78', 'photo-1591047139829-d91aecb6caea'),
  demoProduct('demo-windbreaker', 'LIGHT SHELL JACKET', 'OUTERWEAR', 96, '#555b61', 'photo-1544923246-77307dd654cb'),

  // TEES
  demoProduct('demo-tee-white', 'CORE HEAVYWEIGHT TEE', 'TEES', 32, '#e8e5df', 'photo-1521572163474-6864f9cf17ab'),
  demoProduct('demo-tee-black', 'OVERSIZED BLACK TEE', 'TEES', 34, '#222222', 'photo-1503342217505-b0a15ec3261c'),
  demoProduct('demo-tee-graphic', 'STUDIO GRAPHIC TEE', 'TEES', 38, '#aaa49a', 'photo-1523398002811-999ca8dec234'),

  // ZIP-UPS
  demoProduct('demo-zip-black', 'CORE ZIP HOODIE', 'ZIP-UPS', 82, '#242424', 'photo-1556821840-3a63f95609a7'),
  demoProduct('demo-zip-grey', 'WASHED ZIP-UP', 'ZIP-UPS', 86, '#8b8984', 'photo-1556821846-1a6e7e7e?'),
  demoProduct('demo-zip-cream', 'BOXY ZIP JACKET', 'ZIP-UPS', 84, '#d8d0c1', 'photo-1578681994506-b8f463449011'),
]

export const OUTFIT_IDS: string[] = ['demo-tee-white', 'demo-denim-blue', 'demo-cap-black']
