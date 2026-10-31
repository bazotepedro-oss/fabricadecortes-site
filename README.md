# forjaviral-site

Site de vendas e assinatura para **Fábrica dos Cortes** — ferramenta de cortes com IA.

Stack: Next.js 16 (App Router) · TypeScript strict · Tailwind · Prisma 7/PostgreSQL · AbacatePay.

## Estrutura

```
site/
├── app/                  # Rotas (App Router)
│   ├── api/              # API routes
│   ├── (marketing)/      # Páginas públicas
│   ├── (auth)/           # Admin
│   └── globals.css
├── components/           # UI components
├── lib/                  # Camadas de domínio
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Admin auth
│   ├── abacatepay.ts     # Integração AbacatePay
│   ├── provisioning.ts   # Geração de credenciais
│   ├── railway.ts        # Integração Railway/app
│   ├── email.ts          # E-mail (Resend)
│   ├── ratelimit.ts      # Rate limiting
│   └── utils.ts          # Helpers
├── prisma/
│   └── schema.prisma     # Schema do banco
├── scripts/
│   └── seed.ts           # Seed de planos + admin
└── public/
```

## Setup local

```bash
cd site
cp .env.example .env
# Preencha .env com suas credenciais; configure DATABASE_URL persistente.
npm ci
npx prisma migrate deploy
npm run db:seed
npm run dev
# Acesse http://localhost:3000
```

## Configurar AbacatePay

1. Crie uma conta em [abacatepay.com](https://abacatepay.com).
2. Gere uma API Key no painel.
3. Cole em `ABACATEPAY_API_KEY`.
4. Copie um Webhook Secret forte em `ABACATEPAY_WEBHOOK_SECRET` (mínimo 32 caracteres). Sem ele, o webhook falha fechado.
5. Configure a URL de retorno em `ABACATEPAY_RETURN_URL`.
6. Mapeie os planos em `ABACATEPAY_PLAN_IDS` (JSON com slug -> planId).

## Configurar Railway

1. A ferramenta deve estar hospedada em `RAILWAY_APP_URL`.
2. Se a ferramenta tiver API de provisionamento, configure `APP_PROVISION_URL` e `APP_PROVISION_SECRET`.

## Testar webhook localmente

```bash
# Use o ngrok para expor localhost
ngrok http 3000

# No painel da AbacatePay, aponte o webhook para:
https://<ngrok-url>/api/webhooks/abacatepay

# Para testes manuais, use o script em scripts/test-webhook.ts
npm run test:webhook
```

## Admin

```bash
POST /api/admin/login
Body: {"email": "ADMIN_EMAIL", "password": "ADMIN_PASSWORD"}
# Use o cookie retornado para acessar /admin
```

## Seed

```bash
npm run db:seed
```

Cria/atualiza os pacotes comerciais. O administrador é autenticado por `ADMIN_PASSWORD` e sessão HttpOnly; o seed não cria usuário nem senha padrão.

## Testes

```bash
npm test
```

## Deploy

```bash
npm run build
npm start
# Deploy Vercel (Node.js >=20.9) após migrations e secrets
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa.

### Corte para PostgreSQL

O banco local antigo é SQLite e não é copiado para Vercel. Antes do deploy, faça backup e migre os dados comerciais necessários para PostgreSQL, configure `DATABASE_URL` persistente e aplique `prisma migrate deploy`. Não use `prisma db push` em produção. Gere segredos novos com gerador criptográfico; não reutilize valores que já apareceram no Git.

O rate limit de login e checkout usa buckets atômicos no PostgreSQL, compartilhados entre instâncias serverless. Mantenha também regras de proteção contra DDoS no provedor (WAF), pois limite por IP em aplicação não substitui proteção de borda.

**Rotação obrigatória:** uma versão anterior do `next.config.mjs` publicou `DATABASE_URL` pelo bloco `env`; trate a credencial do banco como exposta, rotacione a senha/URL do PostgreSQL e invalide sessões/segredos antigos antes do próximo deploy.
