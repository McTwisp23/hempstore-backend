import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPrisma } from '../utils/prisma.js'
import { reserveStock } from '../services/inventory.js'
import { createCheckout } from '../services/payment.js'

export function registerCheckoutRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.post('/checkout', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const schema = z.object({
      addressId: z.string(),
      // Front sends sku (productId in UI). We also support productId for flexibility.
      items: z.array(z.object({
        sku: z.string().optional(),
        productId: z.string().optional(),
        quantity: z.number().int().positive()
      })).min(1),
      paymentProvider: z.enum(['mercadopago', 'mock']).default('mercadopago'),
      // Optional metadata
      clientPaymentMethod: z.string().optional()
    })
    const body = schema.parse(request.body)

    // Validate address belongs to user
    const address = await prisma.address.findFirst({ where: { id: body.addressId, userId: request.user.sub } })
    if (!address) return reply.code(404).send({ error: 'Endereço não encontrado' })

    // Normalize items to product IDs
    const skus = body.items.map(i => i.sku).filter(Boolean) as string[]
    const ids = body.items.map(i => i.productId).filter(Boolean) as string[]

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          ...(skus.length ? [{ sku: { in: skus } }] : []),
          ...(ids.length ? [{ id: { in: ids } }] : [])
        ]
      },
      include: { inventory: true }
    })

    // Map each item to product (with proper 400 on invalid SKU/ID)
    const itemLines: Array<{ product: any; quantity: number }> = []
    for (const it of body.items) {
      const p = it.productId
        ? products.find(pp => pp.id === it.productId)
        : it.sku
          ? products.find(pp => pp.sku === it.sku)
          : undefined

      if (!p) {
        return reply.code(400).send({ error: 'Produto inválido/inativo' })
      }
      itemLines.push({ product: p, quantity: it.quantity })
    }

    const subtotalCents = itemLines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0)
    const shippingCents = Number(process.env.SHIPPING_CENTS ?? '790') // matches front std baseline
    const totalCents = subtotalCents + shippingCents

    // Reserve stock first to avoid oversell
    await reserveStock(prisma, itemLines.map(l => ({ productId: l.product.id, quantity: l.quantity })))

    // Create order + items
    const order = await prisma.order.create({
      data: {
        userId: request.user.sub,
        addressId: body.addressId,
        status: 'AWAITING_PAYMENT',
        subtotalCents,
        shippingCents,
        totalCents,
        currency: 'BRL',
        notes: body.clientPaymentMethod ? `clientPaymentMethod=${body.clientPaymentMethod}` : undefined,
        items: {
          create: itemLines.map(l => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPriceCents: l.product.priceCents
          }))
        }
      },
      include: { user: true }
    })

    // Front pages (static hosting)
    const frontBase = (process.env.PUBLIC_FRONT_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    const successUrl = `${frontBase}/checkout-success.html?orderId=${order.id}`
    const failureUrl = `${frontBase}/checkout-failure.html?orderId=${order.id}`
    const pendingUrl = `${frontBase}/checkout-pending.html?orderId=${order.id}`

    const pay = await createCheckout(body.paymentProvider, {
      orderId: order.id,
      title: `Pedido ${order.id}`,
      amountCents: totalCents,
      currency: 'BRL',
      customerEmail: order.user.email,
      successUrl,
      failureUrl,
      pendingUrl
    })

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: pay.provider,
        providerPaymentId: pay.providerPaymentId,
        status: 'PENDING',
        method: body.clientPaymentMethod ?? null
      }
    })

    return reply.code(201).send({
      orderId: order.id,
      totalCents,
      currency: 'BRL',
      checkoutUrl: pay.checkoutUrl
    })
  })
}
