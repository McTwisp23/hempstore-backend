# Hemp Store Backend (MVP)

Backend funcional (MVP) para:
- Cadastro/login (JWT)
- Catálogo de produtos + estoque
- Checkout: cria pedido, reserva estoque e gera link de pagamento (Mercado Pago Checkout Pro ou modo simulado)
- Webhook: confirma pagamento, baixa estoque e **faz settlement em Lightning** (LNbits ou modo simulado)
- Histórico de pedidos do usuário

> **Importante (realidade de pagamentos):** receber via Lightning “independente de como o usuário pagou” exige **um provedor de pagamento** (Pix/boletos/cartões) e uma forma de **conversão BRL→BTC** com saque/pagamento via LN. Este repositório implementa a *orquestração* (eventos, status, estoque, ordem) e um caminho funcional com LNbits; a conexão com provedores reais depende de suas credenciais e compliance.

## Requisitos
- Node.js 20+
- Docker (para Postgres/Redis)

## Rodando em modo 100% local (simulado)
1) Suba banco e redis:
```bash
cd hempstore-backend
docker compose up -d
```
2) Instale dependências:
```bash
npm i
```
3) Configure variáveis:
```bash
cp .env.example .env
```
4) Migre e faça seed:
```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```
5) Rode a API:
```bash
npm run dev
```
- Docs OpenAPI: http://localhost:3001/docs
- Health: http://localhost:3001/health

## Fluxo de compra (simulado)
1) `POST /auth/register` → retorna JWT
2) `POST /addresses` (com JWT)
3) `GET /products`
4) `POST /checkout` (com JWT) → retorna `orderId` e `checkoutUrl`
5) Para aprovar no modo simulado:
```bash
curl -X POST "http://localhost:3001/webhooks/mock/approve?orderId=SEU_ORDER_ID"
```
6) `GET /orders` (com JWT) → histórico e status

## Mercado Pago (Pix/Boleto/Cartão)
- Use Checkout Pro para oferecer múltiplos métodos num único link.
- Configure `MP_ACCESS_TOKEN` e `MP_WEBHOOK_URL`.
- Mercado Pago envia notificações via webhooks. Veja documentação oficial.

## Lightning com LNbits (recebimento em LN)
Este MVP usa **2 carteiras LNbits**:
- `STORE_KEY`: carteira da loja (recebe)
- `TREASURY_KEY`: carteira de tesouraria (paga a invoice da loja)

O settlement funciona assim:
1) Pagamento BRL aprovado → calcula sats via `FX_BRL_PER_BTC`
2) Cria invoice na wallet da loja
3) Tesouraria paga a invoice → loja recebe em LN

Em produção, você normalmente:
- compra sats via uma corretora/PSP e abastece a tesouraria
- automatiza o rebalanceamento e controle de risco

## Nota fiscal e logística
Este MVP **não** implementa NF-e/NFC-e nem integração com transportadoras.
Recomendação:
- NF-e/NFC-e via provedor/API ou ERP (autorização SEFAZ, certificado ICP-Brasil etc.)
- Frete/rastreio via plataforma de logística

