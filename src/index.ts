import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import authPlugin from './plugins/auth.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerCatalogRoutes } from './routes/catalog.js'
import { registerAddressRoutes } from './routes/addresses.js'
import { registerCheckoutRoutes } from './routes/checkout.js'
import { registerOrderRoutes } from './routes/orders.js'
import { registerWebhookRoutes } from './routes/webhooks.js'

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback
  if (!v) throw new Error(`Missing env var ${name}`)
  return v
}

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  credentials: true
})

await app.register(swagger, {
  openapi: {
    info: { title: 'Hemp Store Backend', version: '1.0.0' }
  }
})
await app.register(swaggerUI, { routePrefix: '/docs' })

await app.register(authPlugin, { jwtSecret: required('JWT_SECRET', 'dev-secret-change-me') })

registerAuthRoutes(app)
registerCatalogRoutes(app)
registerAddressRoutes(app)
registerCheckoutRoutes(app)
registerOrderRoutes(app)
registerWebhookRoutes(app)

app.get('/health', async () => ({ ok: true }))

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

await app.listen({ port, host })
