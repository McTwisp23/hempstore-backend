import { PrismaClient } from '@prisma/client'

export type CartItem = { productId: string; quantity: number }

export async function reserveStock(prisma: PrismaClient, items: CartItem[]) {
  // Transaction to prevent overselling
  return prisma.$transaction(async (tx) => {
    for (const it of items) {
      const inv = await tx.inventory.findUnique({ where: { productId: it.productId } })
      if (!inv) throw new Error(`Sem estoque para o produto ${it.productId}`)
      const available = inv.onHand - inv.reserved
      if (available < it.quantity) throw new Error(`Estoque insuficiente para o produto ${it.productId}`)
      await tx.inventory.update({ where: { productId: it.productId }, data: { reserved: { increment: it.quantity } } })
    }
  })
}

export async function releaseReserved(prisma: PrismaClient, items: CartItem[]) {
  return prisma.$transaction(async (tx) => {
    for (const it of items) {
      await tx.inventory.update({ where: { productId: it.productId }, data: { reserved: { decrement: it.quantity } } })
    }
  })
}

export async function commitStock(prisma: PrismaClient, items: CartItem[]) {
  return prisma.$transaction(async (tx) => {
    for (const it of items) {
      // Decrease onHand and reserved
      await tx.inventory.update({
        where: { productId: it.productId },
        data: {
          onHand: { decrement: it.quantity },
          reserved: { decrement: it.quantity }
        }
      })
    }
  })
}
