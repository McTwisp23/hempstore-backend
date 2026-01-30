import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyInstance } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string }
    user: { sub: string; email: string }
  }
}

type Opts = {
  jwtSecret: string
}

export default fp(async function authPlugin(app: FastifyInstance, opts: Opts) {
  app.register(jwt, { secret: opts.jwtSecret })

  app.decorate('authenticate', async function authenticate(request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any
  }
}
