# Configuração do Webhook Stripe em Produção

## Por que o webhook não processou automaticamente?

O pagamento foi processado manualmente com sucesso, mas o webhook não foi chamado. Isso significa que o webhook não está configurado corretamente no Stripe Dashboard para o ambiente de produção.

## Passo a Passo para Configurar o Webhook

### 1. Acessar o Stripe Dashboard

1. Acesse https://dashboard.stripe.com
2. Certifique-se de estar no modo **Live** (não Test mode)
   - Veja no canto superior direito se está "Test mode" ou "Live mode"
   - Para produção, você precisa estar em **Live mode**

### 2. Configurar o Webhook

1. No menu lateral, vá em **Developers** → **Webhooks**
2. Clique em **"Add endpoint"** (ou "Adicionar destino")
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
     - Exemplo: `https://podbrief.online/api/webhooks/stripe`
   - **Description** (opcional): "PodBrief Payment Webhook"
4. Clique em **"Add endpoint"**

### 3. Selecionar Eventos

Após criar o endpoint, você precisa selecionar quais eventos o Stripe deve enviar:

1. Na página do webhook criado, clique em **"Add events"** ou **"Select events"**
2. Selecione os seguintes eventos:
   - ✅ `checkout.session.completed` (obrigatório)
   - ✅ `checkout.session.async_payment_succeeded` (opcional, para pagamentos assíncronos)
   - ✅ `checkout.session.async_payment_failed` (opcional, para falhas)
3. Clique em **"Add events"** ou **"Save"**

### 4. Copiar o Webhook Secret

1. Na página do webhook, procure por **"Signing secret"** ou **"Reveal"**
2. Clique para revelar o secret
3. Copie o valor (começa com `whsec_`)
4. **IMPORTANTE**: Este é diferente do secret de teste!

### 5. Adicionar ao Vercel

1. Acesse o Vercel Dashboard: https://vercel.com
2. Vá no seu projeto → **Settings** → **Environment Variables**
3. Adicione ou atualize:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Cole o secret que você copiou (começa com `whsec_`)
   - **Environment**: Selecione **Production** (e Development se quiser)
4. Clique em **Save**

### 6. Verificar se Está Funcionando

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique no webhook que você criou
3. Na aba **"Events"**, você verá os eventos sendo enviados
4. Se houver eventos com status ❌ (vermelho), clique para ver o erro

### 7. Testar

1. Faça um novo pagamento de teste
2. Verifique se os créditos foram adicionados automaticamente
3. Se não funcionar, verifique os logs no Vercel:
   - Vá em **Deployments** → Seu deployment → **Functions** → `/api/webhooks/stripe`
   - Procure por logs com emojis (📥, 💳, ✅, ❌)

## Troubleshooting

### Webhook não está sendo chamado

- Verifique se a URL está correta (sem trailing slash)
- Verifique se está em **Live mode** no Stripe
- Verifique se o webhook está **ativado** (não desabilitado)

### Webhook está sendo chamado mas falhando

- Verifique os logs no Vercel para ver o erro específico
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado corretamente
- Verifique se o secret é do ambiente correto (Live vs Test)

### Erro de assinatura (signature verification failed)

- O `STRIPE_WEBHOOK_SECRET` está incorreto
- Você está usando o secret de teste em produção (ou vice-versa)
- O webhook foi recriado e você precisa atualizar o secret

## Diferença entre Test e Live Mode

- **Test Mode**: Usa `whsec_test_...` (para desenvolvimento)
- **Live Mode**: Usa `whsec_live_...` (para produção)

Certifique-se de usar o secret correto para cada ambiente!

## Verificar Logs do Webhook

Para ver se o webhook está funcionando:

1. **No Stripe Dashboard**:
   - Developers → Webhooks → Seu webhook → Events
   - Veja os eventos sendo enviados e seus status

2. **No Vercel**:
   - Deployments → Seu deployment → Functions → `/api/webhooks/stripe`
   - Veja os logs detalhados com emojis

## Próximos Passos

Após configurar o webhook:

1. ✅ Adicione o `STRIPE_WEBHOOK_SECRET` ao Vercel
2. ✅ Faça um novo deploy (ou aguarde o próximo)
3. ✅ Teste com um pagamento pequeno
4. ✅ Verifique os logs para confirmar que está funcionando

Os próximos pagamentos devem ser processados automaticamente! 🎉

