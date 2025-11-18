# ⚡ Configuração Rápida do Webhook Stripe

## ❌ Problema Atual

Os pagamentos estão sendo processados, mas os créditos não são adicionados automaticamente porque o webhook não está configurado.

## ✅ Solução em 5 Passos

### Passo 1: Verificar se o Endpoint Está Acessível

1. Acesse: `https://podbrief.online/api/webhooks/test`
2. Você deve ver uma mensagem JSON confirmando que o endpoint está acessível
3. Se não funcionar, verifique se o deploy está ativo

### Passo 2: Acessar o Stripe Dashboard

1. Acesse https://dashboard.stripe.com
2. **IMPORTANTE**: Certifique-se de estar em **Live mode** (não Test mode)
   - Veja no canto superior direito
   - Deve mostrar "Live mode" (não "Test mode")

### Passo 3: Criar o Webhook

1. No menu lateral, vá em **Developers** → **Webhooks**
2. Clique em **"Add endpoint"** ou **"Adicionar destino"**
3. Preencha:
   - **Endpoint URL**: `https://podbrief.online/api/webhooks/stripe`
   - **Description** (opcional): `PodBrief Production Webhook`
4. Clique em **"Add endpoint"**

### Passo 4: Selecionar Eventos

Após criar o endpoint, você verá uma página para selecionar eventos:

1. Clique em **"Add events"** ou **"Select events"**
2. Na categoria **"Checkout"**, selecione:
   - ✅ `checkout.session.completed` (OBRIGATÓRIO)
   - ✅ `checkout.session.async_payment_succeeded` (recomendado)
   - ✅ `checkout.session.async_payment_failed` (recomendado)
3. Clique em **"Add events"** ou **"Save"**

### Passo 5: Copiar o Signing Secret

1. Na página do webhook, procure por **"Signing secret"**
2. Clique em **"Reveal"** ou **"Revelar"** para mostrar o secret
3. Copie o valor (começa com `whsec_live_...`)
   - ⚠️ **ATENÇÃO**: Deve começar com `whsec_live_` (não `whsec_test_`)
4. Vá ao Vercel Dashboard:
   - Projeto → **Settings** → **Environment Variables**
   - Adicione ou atualize:
     - **Name**: `STRIPE_WEBHOOK_SECRET`
     - **Value**: Cole o secret que você copiou
     - **Environment**: Selecione **Production**
   - Clique em **Save**
5. **Faça um novo deploy** (ou aguarde o próximo)

## 🔍 Verificar se Está Funcionando

### No Stripe Dashboard:

1. Vá em **Developers** → **Webhooks**
2. Clique no webhook que você criou
3. Na aba **"Events"**, você verá os eventos sendo enviados
4. Se houver eventos com ❌ (vermelho), clique para ver o erro

### No Vercel:

1. Vá em **Deployments** → Seu deployment → **Functions** → `/api/webhooks/stripe`
2. Procure por logs com emojis:
   - 📥 = Evento recebido
   - 💳 = Processando pagamento
   - ✅ = Sucesso
   - ❌ = Erro

### Testar:

1. Faça um pagamento de teste pequeno ($1.99)
2. Verifique se os créditos foram adicionados automaticamente
3. Se não funcionar, verifique os logs no Vercel

## 🚨 Problemas Comuns

### "Webhook não está sendo chamado"

- ✅ Verifique se está em **Live mode** no Stripe
- ✅ Verifique se a URL está correta: `https://podbrief.online/api/webhooks/stripe`
- ✅ Verifique se o webhook está **ativado** (não desabilitado)

### "Webhook está sendo chamado mas falhando"

- ✅ Verifique os logs no Vercel para ver o erro específico
- ✅ Verifique se `STRIPE_WEBHOOK_SECRET` está configurado corretamente
- ✅ Verifique se o secret é do ambiente correto (`whsec_live_` para produção)

### "Erro de assinatura (signature verification failed)"

- ✅ O `STRIPE_WEBHOOK_SECRET` está incorreto
- ✅ Você está usando o secret de teste em produção (ou vice-versa)
- ✅ O webhook foi recriado e você precisa atualizar o secret

## 📝 Checklist Final

- [ ] Endpoint está acessível (`/api/webhooks/test`)
- [ ] Webhook criado no Stripe Dashboard (Live mode)
- [ ] URL correta: `https://podbrief.online/api/webhooks/stripe`
- [ ] Evento `checkout.session.completed` selecionado
- [ ] Signing secret copiado (começa com `whsec_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` adicionado ao Vercel (Production)
- [ ] Novo deploy feito
- [ ] Testado com um pagamento

## 🎯 Próximos Passos

Após configurar:

1. ✅ Faça um pagamento de teste
2. ✅ Verifique se os créditos foram adicionados automaticamente
3. ✅ Verifique os logs para confirmar que está funcionando

**Importante**: Os pagamentos são processados automaticamente quando o usuário retorna do Stripe através da página de confirmação (`/payment/success`). Mesmo se o webhook falhar, o pagamento será processado automaticamente! 🎉
