import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { getPrisma } from '../utils/prisma.js'

export function registerAuthRoutes(app: FastifyInstance) {
  const prisma = getPrisma()

  app.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          name: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).optional()
    })
    const body = bodySchema.parse(request.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (existing) return reply.code(409).send({ error: 'Email já cadastrado' })

    const passwordHash = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: { email: body.email.toLowerCase(), passwordHash, name: body.name }
    })

    const token = await reply.jwtSign({ sub: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name } }
  })

  app.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
    const body = bodySchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (!user) return reply.code(401).send({ error: 'Credenciais inválidas' })

    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) return reply.code(401).send({ error: 'Credenciais inválidas' })

    const token = await reply.jwtSign({ sub: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name } }
  })

  app.get('/me', { preHandler: [app.authenticate] }, async (request: any) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } })
    return { user: user ? { id: user.id, email: user.email, name: user.name } : null }
  })
}
