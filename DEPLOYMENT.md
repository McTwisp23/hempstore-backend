# Deploy (barato/grátis) – Hempstore Backend

Este backend é **Node + Fastify + Prisma + Postgres**.

## Opção mais barata (geralmente $0) – Railway (API) + Neon (Postgres)

### 1) Banco (Neon)
1. Crie conta no Neon.
2. Crie um *Project* (Postgres).
3. Copie a **connection string** (DATABASE_URL).

### 2) API (Railway)
1. Crie conta no Railway.
2. **New Project → Deploy from GitHub repo** (recomendado) ou faça upload do código.
3. Em **Variables**, configure:
   - `DATABASE_URL` = (string do Neon)
   - `JWT_SECRET` = uma senha longa
   - `CORS_ORIGIN` = URL do seu site (ex.: https://seusite.pages.dev)
   - `PUBLIC_FRONT_URL` = URL do seu site
   - `SHIPPING_CENTS` = (opcional)
   - Se não for usar Mercado Pago agora: `SIMULATE_PAYMENTS=true`
   - Se não for usar Lightning agora: `SIMULATE_LIGHTNING=true`
4. Em **Settings → Deploy**, garanta:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
5. Depois de deploy, copie a URL pública do Railway (ex.: https://minha-api.up.railway.app)

### 3) Migrações e seed
No Railway, abra **Shell** e rode:
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

Pronto: sua API estará no ar.

## Local (para testar)
1. `docker compose up -d`
2. `npm i`
3. `cp .env.example .env`
4. `npx prisma generate && npx prisma migrate dev && npm run seed`
5. `npm run dev`
