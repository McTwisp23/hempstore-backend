import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = [
  {
    "sku": "oil-cbd",
    "name": "Óleo CBD",
    "priceCents": 3990,
    "description": "Óleo CBD (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "oil-cbg",
    "name": "Óleo CBG",
    "priceCents": 4290,
    "description": "Óleo CBG (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "oil-thc",
    "name": "Óleo THC",
    "priceCents": 4990,
    "description": "Óleo THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "oil-full-spectrum",
    "name": "Óleo Full Spectrum",
    "priceCents": 4490,
    "description": "Óleo Full Spectrum (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "strain-gorilla-glue",
    "name": "Gorilla Glue",
    "priceCents": 5990,
    "description": "Gorilla Glue (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "strain-purple-haze",
    "name": "Purple Haze",
    "priceCents": 5990,
    "description": "Purple Haze (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "strain-og-kush",
    "name": "OG Kush",
    "priceCents": 5990,
    "description": "OG Kush (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "cigar-san-juan",
    "name": "Charutos San Juan",
    "priceCents": 7990,
    "description": "Charutos San Juan (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "juanitos",
    "name": "Juanitos (pre-roll)",
    "priceCents": 1490,
    "description": "Juanitos (pre-roll) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "extract-dry",
    "name": "Dry",
    "priceCents": 2990,
    "description": "Dry (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "extract-bubble-hash",
    "name": "Bubble Hash",
    "priceCents": 3490,
    "description": "Bubble Hash (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "extract-rosin",
    "name": "Rosin",
    "priceCents": 3990,
    "description": "Rosin (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "extract-live-rosin",
    "name": "Live Rosin",
    "priceCents": 4490,
    "description": "Live Rosin (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "extract-diamonds",
    "name": "Diamonds THC/CBD",
    "priceCents": 4990,
    "description": "Diamonds THC/CBD (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-gummies",
    "name": "Gumes (Gummies)",
    "priceCents": 2490,
    "description": "Gumes (Gummies) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-honey",
    "name": "Mel infundido de THC",
    "priceCents": 2990,
    "description": "Mel infundido de THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-butter",
    "name": "Manteiga Trufada de THC",
    "priceCents": 3290,
    "description": "Manteiga Trufada de THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-chocolate",
    "name": "Chocolate",
    "priceCents": 1990,
    "description": "Chocolate (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-gum",
    "name": "Chicletes CBD e THC",
    "priceCents": 1490,
    "description": "Chicletes CBD e THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "edible-lollipops",
    "name": "Pirulitos THC (sabores)",
    "priceCents": 1690,
    "description": "Pirulitos THC (sabores) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "bev-soda",
    "name": "Refrigerante infundido THC/CBD",
    "priceCents": 1290,
    "description": "Refrigerante infundido THC/CBD (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "bev-tea",
    "name": "Chá infundido THC",
    "priceCents": 1090,
    "description": "Chá infundido THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "bev-lemonade",
    "name": "Limonada infundida THC",
    "priceCents": 1190,
    "description": "Limonada infundida THC (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "vape-thc",
    "name": "Vape THC (sabores)",
    "priceCents": 5990,
    "description": "Vape THC (sabores) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "pet-pet-oil",
    "name": "Óleo CBD Pet",
    "priceCents": 2990,
    "description": "Óleo CBD Pet (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "pet-pet-calming",
    "name": "Pet Calming Chews (CBD)",
    "priceCents": 2490,
    "description": "Pet Calming Chews (CBD) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "pet-pet-joints",
    "name": "Pet Joint Support (CBD)",
    "priceCents": 2690,
    "description": "Pet Joint Support (CBD) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "pet-pet-balm",
    "name": "Bálsamo tópico CBD (Pet)",
    "priceCents": 1990,
    "description": "Bálsamo tópico CBD (Pet) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-hemp-pen",
    "name": "Canetas Hemp",
    "priceCents": 990,
    "description": "Canetas Hemp (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-tshirt",
    "name": "Camisetas",
    "priceCents": 3990,
    "description": "Camisetas (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-cap",
    "name": "Bonés (trucker)",
    "priceCents": 2990,
    "description": "Bonés (trucker) (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-grinder",
    "name": "Dichavadores",
    "priceCents": 1990,
    "description": "Dichavadores (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-tips",
    "name": "Piteiras",
    "priceCents": 790,
    "description": "Piteiras (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-papers",
    "name": "Sedas",
    "priceCents": 690,
    "description": "Sedas (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-roller",
    "name": "Bolador",
    "priceCents": 1290,
    "description": "Bolador (catálogo do front).",
    "onHand": 100
  },
  {
    "sku": "acc-bong",
    "name": "Bongs",
    "priceCents": 8990,
    "description": "Bongs (catálogo do front).",
    "onHand": 100
  }
]

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        active: true
      },
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        active: true,
        inventory: { create: { onHand: p.onHand, reserved: 0 } }
      },
      include: { inventory: true }
    })

    // If product existed without inventory, ensure it.
    if (!product.inventory) {
      await prisma.inventory.create({
        data: { productId: product.id, onHand: p.onHand, reserved: 0 }
      })
    }
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
