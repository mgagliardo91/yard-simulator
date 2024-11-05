export type TruckOrder = {
  cargo: string
  duration: number
  number: number
}

const products = [
  'Chicken Toes',
  'Mystery Meatballs',
  'Lumpy Lemonade',
  'Egg Slushies',
  'Fish Heads',
  'Soggy Spuds',
  'Mayo Milkshakes',
  'Sardine Smoothie',
  'Minty Meatloaf',
  'Shrimp Sorbet',
  'Bologna Pops',
  'Sour Cream Soda'
]

export const generateOrder = (number: number): TruckOrder => {

  return {
    cargo: products[Math.floor(Math.random() * products.length)],
    duration: Math.floor(Math.random() * (30 - 15 + 1)) + 5,
    number,
  }

}