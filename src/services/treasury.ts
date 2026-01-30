import { PrismaClient } from '@prisma/client'
import { createStoreInvoice, payInvoiceFromTreasury } from './lightning.js'

export async function settleToLightning(prisma: PrismaClient, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true }
  })
  if (!order) throw new Error('Pedido não encontrado')

  const existing = await prisma.lightningPayout.findUnique({ where: { orderId } })
  if (existing && (existing.status === 'SETTLED' || existing.status === 'IN_PROGRESS')) {
    return existing
  }

  const brlPerBtc = Number(process.env.FX_BRL_PER_BTC ?? '0')
  if (!brlPerBtc || brlPerBtc <= 0) throw new Error('Defina FX_BRL_PER_BTC (ex: 300000)')

  const amountBrl = order.totalCents / 100
  const sats = Math.max(1, Math.floor((amountBrl / brlPerBtc) * 100_000_000))

  const payout = await prisma.lightningPayout.upsert({
    where: { orderId },
    update: { status: 'IN_PROGRESS', sats },
    create: { orderId, status: 'IN_PROGRESS', sats, provider: process.env.LN_PROVIDER ?? 'lnbits' }
  })

  if (process.env.SIMULATE_LIGHTNING === 'true') {
    return prisma.lightningPayout.update({
      where: { id: payout.id },
      data: { status: 'SETTLED', invoice: 'simulated', preimage: 'simulated' }
    })
  }

  const baseUrl = process.env.LNBITS_URL
  const storeApiKey = process.env.LNBITS_STORE_KEY
  const treasuryApiKey = process.env.LNBITS_TREASURY_KEY
  if (!baseUrl || !storeApiKey || !treasuryApiKey) {
    throw new Error('Configure LNBITS_URL, LNBITS_STORE_KEY e LNBITS_TREASURY_KEY (ou SIMULATE_LIGHTNING=true)')
  }

  const memo = `HempStore order ${order.id}`
  const inv = await createStoreInvoice({ baseUrl, storeApiKey, treasuryApiKey }, sats, memo)

  let paid
  try {
    paid = await payInvoiceFromTreasury({ baseUrl, storeApiKey, treasuryApiKey }, inv.bolt11)
  } catch (e: any) {
    await prisma.lightningPayout.update({
      where: { id: payout.id },
      data: { status: 'FAILED', invoice: inv.bolt11, error: String(e?.message ?? e) }
    })
    throw e
  }

  return prisma.lightningPayout.update({
    where: { id: payout.id },
    data: { status: 'SETTLED', invoice: inv.bolt11, preimage: paid.preimage }
  })
}
