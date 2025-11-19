# Guia de Deploy - PodBrief

Este guia contém todas as informações necessárias para colocar o PodBrief em produção.

## 📋 Checklist Pré-Deploy

### 1. Variáveis de Ambiente

Configure todas as variáveis de ambiente no seu provedor de deploy (Vercel, Railway, etc.):

#### 🔐 Autenticação (Kinde)

```env
KINDE_SITE_URL=https://podbrief.online
KINDE_POST_LOGOUT_REDIRECT_URL=https://podbrief.online
KINDE_POST_LOGIN_REDIRECT_URL=https://podbrief.online
KINDE_CLIENT_ID=seu_client_id
KINDE_CLIENT_SECRET=seu_client_secret
```

**Como obter:**

1. Acesse [Kinde Dashboard](https://app.kinde.com)
2. Vá em Settings → Applications
3. Copie o Client ID e Client Secret
4. Configure as URLs de redirect para `https://podbrief.online`

#### 💳 Pagamentos (Stripe)

```env
STRIPE_PUB_KEY=pk_live_... (chave pública de produção)
STRIPE_SECRET_KEY=sk_live_... (chave secreta de produção)
STRIPE_WEBHOOK_SECRET=whsec_... (webhook secret de produção)

# Price IDs de produção (obtidos após criar produtos no Stripe)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_CREATOR=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_STUDIO=price_...
STRIPE_PRICE_AGENCY=price_...
```

**Como configurar:**

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Mude para modo **Live** (canto superior direito)
3. Vá em Developers → API keys
4. Copie as chaves de produção (não use as de teste!)
5. Crie os produtos de produção (mesmos passos do STRIPE_SETUP.md)
6. **Configure o webhook de produção** (IMPORTANTE!):
   - Veja o guia completo em `STRIPE_WEBHOOK_SETUP.md`
   - URL do webhook: `https://podbrief.online/api/webhooks/stripe`
   - Eventos necessários: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   - Copie o **Signing secret** (começa com `whsec_`) e adicione como `STRIPE_WEBHOOK_SECRET`
   - Vá em Developers → Webhooks
   - Clique em "Add endpoint" ou "Adicionar destino"
   - Preencha os campos:
     - **Nome de destino:** `PodBrief Production` (opcional, mas recomendado)
     - **URL do endpoint:** `https://podbrief.online/api/webhooks/stripe`
     - **Descrição:** `Webhook para processar pagamentos` (opcional)
   - **Selecione os eventos:** Na categoria **"Checkout"**, selecione:
     - ✅ `checkout.session.completed` (obrigatório)
     - ✅ `checkout.session.async_payment_succeeded` (recomendado)
     - ✅ `checkout.session.async_payment_failed` (recomendado)
   - Clique em "Add endpoint" ou "Criar destino"
   - Copie o Signing secret (começa com `whsec_`)

#### 📧 Emails (Resend)

```env
RESEND_API_KEY=re_... (chave de produção)
RESEND_FROM_EMAIL=noreply@podbrief.online
SUPPORT_EMAIL=support@podbrief.online
```

**Como configurar:**

1. Acesse [Resend Dashboard](https://resend.com)
2. Vá em API Keys
3. Crie uma nova API Key para produção
4. Certifique-se de que o domínio `podbrief.online` está verificado
5. Veja mais detalhes em `RESEND_SETUP.md`

#### 🤖 OpenAI

```env
OPEN_AI_KEY=sk-... (chave de produção)
```

**Como configurar:**

1. Acesse [OpenAI Platform](https://platform.openai.com)
2. Vá em API Keys
3. Crie uma nova chave de produção
4. Configure limites de uso se necessário

#### 🗄️ Banco de Dados (MongoDB)

```env
DATABASE_URL=mongodb+srv://... (URL de conexão do MongoDB)
```

**Opções de banco de dados:**

- **MongoDB Atlas** (recomendado - gratuito até 512MB)
- **Railway** (MongoDB)
- **MongoDB local** (não recomendado para produção)

**Como configurar MongoDB Atlas:**

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster (Free tier disponível)
4. Configure Network Access (adicione IP 0.0.0.0/0 para permitir todos os IPs, ou IPs específicos)
5. Crie um usuário de banco de dados
6. Copie a connection string: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
7. Substitua `<password>` pela senha do usuário
8. Adicione como `DATABASE_URL`

**Nota:** Como está usando MongoDB, não há migrações como no PostgreSQL. O Prisma criará as coleções automaticamente quando necessário.

#### 📦 Armazenamento de Arquivos (Vercel Blob)

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_... (token do Vercel Blob)
```

**Como configurar:**

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Storage**
3. Clique em **Create Database** → Selecione **Blob**
4. Escolha um nome para o Blob Store (ex: `podbrief-blob`)
5. Após criar, vá em **Settings** → **Storage** → Selecione o Blob Store criado
6. Vá na aba **Settings** do Blob Store
7. Copie o **Token** (começa com `vercel_blob_`)
8. Adicione como variável de ambiente `BLOB_READ_WRITE_TOKEN` no projeto Vercel:
   - Vá em **Settings** → **Environment Variables**
   - Adicione `BLOB_READ_WRITE_TOKEN` com o valor do token
   - Selecione todos os ambientes (Production, Preview, Development)
   - Clique em **Save**

**Nota:** O Vercel Blob é necessário para uploads de arquivos grandes (>4MB) que são divididos em chunks. Sem este token, uploads grandes falharão.

#### 🌐 URLs da Aplicação

```env
NEXT_PUBLIC_APP_URL=https://podbrief.online
```

#### ⚡ Rate Limiting (Upstash Redis - Opcional)

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Como configurar:**

1. Acesse [Upstash](https://upstash.com)
2. Crie um banco Redis
3. Copie a URL e Token
4. Se não configurar, o rate limiting usará memória local (menos eficiente)

### 2. Configuração do Domínio

#### 2.1. Configurar DNS

Configure os registros DNS do domínio `podbrief.online`:

1. **Registros A/CNAME** (para o servidor):

   - Se usar Vercel: siga as instruções do Vercel
   - Geralmente: `@` → IP do servidor ou `CNAME` → `cname.vercel-dns.com`

2. **Registros MX** (para receber emails):

   - Configure conforme seu provedor de email
   - Exemplo para Gmail: `MX` → `aspmx.l.google.com` (prioridade 10)

3. **Registros SPF/DKIM** (para enviar emails):
   - Já configurados no Resend (veja `RESEND_SETUP.md`)

#### 2.2. SSL/HTTPS

- **Vercel**: SSL automático
- **Outros provedores**: Configure certificado SSL (Let's Encrypt recomendado)

### 3. Banco de Dados

#### 3.1. Gerar Prisma Client

```bash
# O Prisma Client será gerado automaticamente durante o build
# Mas você pode gerar manualmente:
npx prisma generate
```

**Nota:** Como está usando MongoDB, não há migrações. O Prisma criará as coleções automaticamente na primeira execução.

#### 3.2. Verificar Conexão

Teste a conexão com o banco:

```bash
npx prisma db pull
```

Ou use o health check da aplicação após o deploy: `https://podbrief.online/api/health`

### 4. Build e Testes

#### 4.1. Build Local (Teste)

```bash
npm run build
```

Verifique se o build funciona sem erros.

#### 4.2. Testar Variáveis de Ambiente

Crie um arquivo `.env.production` localmente (não commite!) e teste:

```bash
npm run build
npm run start
```

### 5. Deploy na Vercel (Recomendado)

#### 5.1. Instalar Vercel CLI

```bash
npm i -g vercel
```

#### 5.2. Fazer Login

```bash
vercel login
```

#### 5.3. Deploy

```bash
# Deploy de produção
vercel --prod

# Ou conecte o repositório GitHub no dashboard da Vercel
```

#### 5.4. Configurar Variáveis de Ambiente

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em Settings → Environment Variables
3. Adicione todas as variáveis listadas acima
4. Certifique-se de marcar "Production", "Preview" e "Development"

#### 5.5. Configurar Domínio

1. Vá em Settings → Domains
2. Adicione `podbrief.online`
3. Configure os registros DNS conforme instruções

### 6. Pós-Deploy

#### 6.1. Verificar Health Check

Acesse: `https://podbrief.online/api/health`

Deve retornar:

```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "diskSpace": "healthy",
    "openai": "configured"
  }
}
```

#### 6.2. Testar Funcionalidades

- [ ] Criar conta (autenticação)
- [ ] Fazer upload de áudio
- [ ] Ver transcrição
- [ ] Comprar créditos (modo teste primeiro!)
- [ ] Receber emails
- [ ] Formulário de contato

#### 6.3. Configurar Webhooks

**Stripe Webhook:**

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint" ou "Adicionar destino"
3. Preencha os campos:
   - **Nome de destino:** `PodBrief Production` (opcional, mas recomendado para organização)
   - **URL do endpoint:** `https://podbrief.online/api/webhooks/stripe`
   - **Descrição:** `Webhook para processar pagamentos e adicionar créditos` (opcional)
4. **Selecione os eventos necessários:**
   - Na categoria **"Checkout"**, selecione:
     - ✅ `checkout.session.completed` (obrigatório)
     - ✅ `checkout.session.async_payment_succeeded` (recomendado)
     - ✅ `checkout.session.async_payment_failed` (recomendado)
5. Clique em "Add endpoint" ou "Criar destino"
6. **Copie o Signing Secret** (começa com `whsec_`)
7. Adicione como variável de ambiente `STRIPE_WEBHOOK_SECRET` no Vercel

**Nota:**

- Os campos "Nome de destino" e "Descrição" são opcionais, mas recomendados para facilitar a identificação futura
- Você pode selecionar apenas os eventos da categoria "Checkout". Não precisa selecionar eventos de outras categorias (Account, Balance, etc.).

#### 6.4. Monitoramento

Configure monitoramento:

- **Vercel Analytics**: Ative no dashboard
- **Sentry** (opcional): Para tracking de erros
- **Logs**: Monitore logs no dashboard do Vercel

### 7. Segurança

#### 7.1. Checklist de Segurança

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Chaves de API são de produção (não de teste)
- [ ] HTTPS está ativo
- [ ] CORS está configurado corretamente
- [ ] Rate limiting está ativo
- [ ] Validação de entrada está funcionando

#### 7.2. Backups

Configure backups regulares:

- **Banco de dados**: Configure backup automático no seu provedor
- **Arquivos**: Se usar armazenamento de arquivos, configure backup

### 8. Otimizações

#### 8.1. Performance

- [ ] Imagens otimizadas (Next.js Image)
- [ ] Cache configurado
- [ ] CDN ativo (Vercel tem CDN automático)

#### 8.2. SEO

- [ ] Meta tags configuradas
- [ ] Sitemap.xml
- [ ] robots.txt

### 9. Troubleshooting

#### Problema: Build falha

**Solução:**

- Verifique logs do build
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se há erros de TypeScript

#### Problema: Erro de conexão com banco

**Solução:**

- Verifique `DATABASE_URL`
- Certifique-se de que o banco aceita conexões externas
- Verifique firewall/whitelist de IPs

#### Problema: Emails não são enviados

**Solução:**

- Verifique `RESEND_API_KEY`
- Verifique se o domínio está verificado no Resend
- Veja logs no dashboard do Resend

#### Problema: Pagamentos não funcionam

**Solução:**

- Verifique se está usando chaves de produção do Stripe
- Verifique se o webhook está configurado
- Verifique `STRIPE_WEBHOOK_SECRET`

### 10. Manutenção

#### 10.1. Atualizações

```bash
# Atualizar dependências
npm update

# Gerar Prisma Client após atualizar schema
npx prisma generate
```

**Nota:** O script `postinstall` no `package.json` gera automaticamente o Prisma Client após `npm install`.

#### 10.2. Logs

Monitore logs regularmente:

- Vercel: Dashboard → Deployments → View Function Logs
- Resend: Dashboard → Emails
- Stripe: Dashboard → Events

### 11. Suporte

Se encontrar problemas:

1. Verifique os logs
2. Consulte a documentação específica:
   - `RESEND_SETUP.md` para emails
   - `STRIPE_SETUP.md` para pagamentos
3. Verifique o health check: `/api/health`

---

## 🚀 Deploy Rápido (Vercel)

1. **Conecte o repositório GitHub ao Vercel**
2. **Configure todas as variáveis de ambiente**
3. **Configure o domínio**
4. **Deploy automático!**

O Vercel fará o build e deploy automaticamente a cada push para a branch principal.

---

**Boa sorte com o deploy! 🎉**
