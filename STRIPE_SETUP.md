# Configuração do Stripe - PodBrief

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Stripe API Keys (já configuradas)
STRIPE_PUB_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (obtido após configurar webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL da aplicação (para redirects após pagamento)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Price IDs (obtidos após criar produtos no Stripe Dashboard)
# Formato: STRIPE_PRICE_[PLAN_ID_MAIUSCULO]
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_CREATOR=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_STUDIO=price_...
STRIPE_PRICE_AGENCY=price_...
```

## Passo a Passo para Configuração

### 1. Criar Produtos no Stripe Dashboard

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Clique em "Add product"
3. Para cada plano em `PRICING_PLANS`, crie um produto:
   - **Starter**: $1.99 - 20 créditos
   - **Creator**: $4.99 - 50 créditos
   - **Pro**: $9.99 - 120 créditos
   - **Studio**: $19.99 - 300 créditos
   - **Agency**: $34.99 - 600 créditos

4. Para cada produto:
   - Nome: "PodBrief [Plan Name] - [X] Credits"
   - Preço: Valor do plano
   - Tipo: One-time payment
   - Copie o **Price ID** (começa com `price_`)

5. Adicione os Price IDs ao `.env`:
   ```env
   STRIPE_PRICE_STARTER=price_xxxxx
   STRIPE_PRICE_CREATOR=price_xxxxx
   STRIPE_PRICE_PRO=price_xxxxx
   STRIPE_PRICE_STUDIO=price_xxxxx
   STRIPE_PRICE_AGENCY=price_xxxxx
   ```

### 2. Configurar Webhook (Desenvolvimento com Stripe CLI)

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Faça login: `stripe login`
3. Inicie o webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copie o **Webhook signing secret** (começa com `whsec_`)
5. Adicione ao `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 3. Testar o Fluxo

1. Inicie o servidor: `npm run dev`
2. Em outro terminal, inicie o webhook listener: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Acesse `/pricing` e clique em "Purchase Credits"
4. Use cartão de teste: `4242 4242 4242 4242`
5. Complete o pagamento
6. Verifique se os créditos foram adicionados ao usuário

## Cartões de Teste

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Qualquer data futura e CVC válido (ex: 123).

## Produção

Quando estiver pronto para produção:

1. Troque para chaves de produção no Stripe Dashboard
2. Configure webhook em produção no Stripe Dashboard
3. Atualize `NEXT_PUBLIC_APP_URL` com sua URL de produção
4. Atualize as variáveis de ambiente no servidor

