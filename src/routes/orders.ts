import type { FastifyInstance } from 'fastify'
import { getPrisma } from '../utils/prisma.js'

export function registerOrderRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.get('/orders', { preHandler: [app.authenticate] }, async (request: any) => {
    const orders = await prisma.order.findMany({
      where: { userId: request.user.sub },
      include: { items: { include: { product: true } }, payment: true, lightningPayout: true },
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(o => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      currency: o.currency,
      createdAt: o.createdAt,
      paymentStatus: o.payment?.status,
      lightningStatus: o.lightningPayout?.status,
      items: o.items.map(i => ({
        productId: i.productId,
        sku: i.product.sku,
        name: i.product.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents
      }))
    }))
  })

  app.get('/orders/:id', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const id = request.params.id as string
    const order = await prisma.order.findFirst({
      where: { id, userId: request.user.sub },
      include: { items: { include: { product: true } }, payment: true, lightningPayout: true, address: true }
    })
    if (!order) return reply.code(404).send({ error: 'Pedido não encontrado' })
    return order
  })
}
