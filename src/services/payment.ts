import mercadopago from 'mercadopago'
import { nanoid } from 'nanoid'

export type PaymentProvider = 'mercadopago' | 'mock'

export type CreatePaymentResult =
  | { provider: 'mercadopago'; checkoutUrl: string; providerPaymentId?: string }
  | { provider: 'mock'; checkoutUrl: string; providerPaymentId: string }

export function configureMercadoPago() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não definido')
  ;(mercadopago as any).configure({ access_token: token })
}

export async function createCheckout(provider: PaymentProvider, opts: {
  orderId: string
  title: string
  amountCents: number
  currency: string
  customerEmail: string
  successUrl: string
  failureUrl: string
  pendingUrl: string
}) : Promise<CreatePaymentResult> {
  if (provider === 'mock' || process.env.SIMULATE_PAYMENTS === 'true') {
    const pid = `mock_${nanoid(10)}`
    return {
      provider: 'mock',
      providerPaymentId: pid,
      checkoutUrl: `${opts.successUrl}?orderId=${opts.orderId}&mockPaymentId=${pid}`
    }
  }

  configureMercadoPago()

  // Checkout Pro preference: easiest way to offer PIX/BOLETO/CARD in one link.
  const preference = {
    external_reference: opts.orderId,
    payer: { email: opts.customerEmail },
    items: [
      {
        id: opts.orderId,
        title: opts.title,
        quantity: 1,
        currency_id: opts.currency,
        unit_price: Number((opts.amountCents / 100).toFixed(2))
      }
    ],
    back_urls: {
      success: opts.successUrl,
      failure: opts.failureUrl,
      pending: opts.pendingUrl
    },
    auto_return: 'approved',
    notification_url: process.env.MP_WEBHOOK_URL
  }

  const resp = await (mercadopago as any).preferences.create(preference)
  const checkoutUrl = resp?.body?.init_point
  if (!checkoutUrl) throw new Error('Mercado Pago não retornou init_point')
  return { provider: 'mercadopago', checkoutUrl, providerPaymentId: String(resp?.body?.id ?? '') }
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  configureMercadoPago()
  const resp = await (mercadopago as any).payment.findById(paymentId)
  return resp?.body
}
