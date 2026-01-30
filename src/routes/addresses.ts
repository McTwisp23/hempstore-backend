import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPrisma } from '../utils/prisma.js'

export function registerAddressRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.get('/addresses', { preHandler: [app.authenticate] }, async (request: any) => {
    const addresses = await prisma.address.findMany({ where: { userId: request.user.sub }, orderBy: { createdAt: 'desc' } })
    return addresses
  })

  app.post('/addresses', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const schema = z.object({
      label: z.string().optional(),
      recipient: z.string().min(1),
      phone: z.string().optional(),
      street: z.string().min(1),
      number: z.string().min(1),
      complement: z.string().optional(),
      district: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(2).max(2),
      zip: z.string().min(8)
    })
    const body = schema.parse(request.body)

    const address = await prisma.address.create({
      data: { ...body, userId: request.user.sub }
    })

    return reply.code(201).send(address)
  })
}
