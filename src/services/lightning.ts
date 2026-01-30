import { fetch } from 'undici'

export type LnbitsConfig = {
  baseUrl: string
  storeApiKey: string
  treasuryApiKey?: string
}

function headers(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey
  }
}

export async function createStoreInvoice(cfg: LnbitsConfig, sats: number, memo: string) {
  const url = new URL('/api/v1/payments', cfg.baseUrl).toString()
  const r = await fetch(url, {
    method: 'POST',
    headers: headers(cfg.storeApiKey),
    body: JSON.stringify({ out: false, amount: sats, memo })
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`LNbits create invoice failed: ${r.status} ${text}`)
  }
  const data: any = await r.json()
  // Common LNbits response fields: payment_request / bolt11
  const bolt11 = data.payment_request ?? data.bolt11
  if (!bolt11) throw new Error('LNbits não retornou bolt11')
  return { bolt11, paymentHash: data.payment_hash ?? data.payment_hash }
}

export async function payInvoiceFromTreasury(cfg: LnbitsConfig, bolt11: string) {
  if (!cfg.treasuryApiKey) throw new Error('treasuryApiKey não definido')
  const url = new URL('/api/v1/payments', cfg.baseUrl).toString()
  const r = await fetch(url, {
    method: 'POST',
    headers: headers(cfg.treasuryApiKey),
    body: JSON.stringify({ out: true, bolt11 })
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`LNbits pay invoice failed: ${r.status} ${text}`)
  }
  const data: any = await r.json()
  return { paymentHash: data.payment_hash ?? data.payment_hash, preimage: data.preimage }
}
