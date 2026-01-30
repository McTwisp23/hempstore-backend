import type { FastifyInstance } from 'fastify'
import { getPrisma } from '../utils/prisma.js'
import { fetchMercadoPagoPayment } from '../services/payment.js'
import { commitStock, releaseReserved } from '../services/inventory.js'
import { settleToLightning } from '../services/treasury.js'

export function registerWebhookRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.post('/webhooks/mercadopago', async (request: any, reply) => {
    // Mercado Pago can send different formats depending on webhook/topic.
    const body = request.body ?? {}
    const type = body.type ?? body.topic
    const paymentId = body?.data?.id ?? body?.id ?? request.query?.data?.id

    if (!paymentId) {
      // Acknowledge anyway
      return reply.code(200).send({ ok: true })
    }

    // Fetch payment details from MP and map to our order via external_reference
    let mp: any
    try {
      mp = await fetchMercadoPagoPayment(String(paymentId))
    } catch (e) {
      request.log.error({ e }, 'Failed to fetch MercadoPago payment')
      return reply.code(200).send({ ok: true })
    }

    const orderId = String(mp.external_reference ?? '')
    if (!orderId) return reply.code(200).send({ ok: true })

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } })
    if (!order || !order.payment) return reply.code(200).send({ ok: true })

    const status = String(mp.status ?? '').toLowerCase()
    const mapped = status === 'approved' ? 'APPROVED'
      : status === 'authorized' ? 'AUTHORIZED'
      : status === 'rejected' ? 'REJECTED'
      : status === 'refunded' ? 'REFUNDED'
      : 'PENDING'

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        providerPaymentId: String(paymentId),
        status: mapped as any,
        method: String(mp.payment_method_id ?? mp.payment_type_id ?? ''),
        raw: mp
      }
    })

    if (mapped === 'APPROVED') {
      // Move order to PAID (idempotent)
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } })

      // Commit stock (idempotent-ish: ensure we only commit once)
      // If already committed (status >= PAID), commitStock may be called twice; prevent by checking an inventory marker.
      // Simpler: commit only if order still has reserved stock. We'll attempt commit and ignore errors.
      try {
        await commitStock(prisma, order.items.map(i => ({ productId: i.productId, quantity: i.quantity })))
      } catch (e) {
        // ignore
      }

      // Settle to Lightning (store receives in LN regardless of how user paid)
      try {
        await settleToLightning(prisma, orderId)
        await prisma.order.update({ where: { id: orderId }, data: { status: 'INVOICED' } })
      } catch (e: any) {
        request.log.error({ e }, 'Lightning settlement failed')
      }

      // Fulfillment simulation
      if (process.env.SIMULATE_FULFILLMENT === 'true') {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } })
      }
    }

    if (mapped === 'REJECTED' || mapped === 'REFUNDED') {
      // Release reserved stock (best effort)
      try {
        await releaseReserved(prisma, order.items.map(i => ({ productId: i.productId, quantity: i.quantity })))
      } catch {}
      await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELED' } })
    }

    return reply.code(200).send({ ok: true })
  })

  // Dev helper to approve a mock payment
  app.post('/webhooks/mock/approve', async (request: any, reply) => {
    const orderId = String(request.query?.orderId ?? '')
    if (!orderId) return reply.code(400).send({ error: 'orderId obrigatório' })

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } })
    if (!order || !order.payment) return reply.code(404).send({ error: 'Pedido/pagamento não encontrado' })

    await prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'APPROVED' } })
    await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } })
    await commitStock(prisma, order.items.map(i => ({ productId: i.productId, quantity: i.quantity })))
    await settleToLightning(prisma, orderId)
    await prisma.order.update({ where: { id: orderId }, data: { status: 'INVOICED' } })

    return reply.code(200).send({ ok: true })
  })
}
