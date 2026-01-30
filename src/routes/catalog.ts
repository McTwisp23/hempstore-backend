import type { FastifyInstance } from 'fastify'
import { getPrisma } from '../utils/prisma.js'

export function registerCatalogRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.get('/products', async (request) => {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' }
    })

    return products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      stock: p.inventory ? Math.max(0, p.inventory.onHand - p.inventory.reserved) : 0
    }))
  })
}
