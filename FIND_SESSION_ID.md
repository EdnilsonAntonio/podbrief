# Como Encontrar o Stripe Session ID

## Método 1: Via URL Após Pagamento (MAIS FÁCIL) ⭐

Após fazer um pagamento bem-sucedido, o Session ID aparece automaticamente na URL:

1. Após o pagamento, você será redirecionado para: 
   `https://seu-dominio.com/dashboard?payment=success&session_id=cs_test_abc123...`

2. O Session ID é o valor após `session_id=`
   - Exemplo: `cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6`

3. Se os créditos não foram adicionados, aparecerá um botão "Verify Payment" na notificação que leva você diretamente para a página de verificação com o ID já preenchido.

## Método 2: Via Stripe Dashboard → Developers → Events

1. Acesse https://dashboard.stripe.com
2. No menu lateral, clique em **Developers**
3. Clique em **Events** (ou vá diretamente para https://dashboard.stripe.com/test/events)
4. Na barra de busca/filtro, digite: `checkout.session.completed`
5. Encontre o evento do seu pagamento (use a data/hora)
6. Clique no evento
7. Na seção **"Event data"**, procure por:
   ```json
   {
     "id": "cs_test_abc123...",
     "object": "checkout.session",
     ...
   }
   ```
8. O valor de `id` é o Session ID que você precisa

## Método 3: Via Stripe Dashboard → Developers → Webhooks

1. Acesse https://dashboard.stripe.com
2. No menu lateral, clique em **Developers**
3. Clique em **Webhooks**
4. Clique no webhook configurado
5. Na aba **"Events"**, encontre o evento `checkout.session.completed`
6. Clique no evento
7. Na seção **"Event data"**, procure por `id` - esse é o Session ID

## Método 4: Via Payment Intent (se você souber o Payment Intent ID)

1. No menu lateral, vá em **Payments** → **Payments**
2. Encontre o pagamento
3. Clique no pagamento
4. Procure por **"Checkout session"** ou **"Related objects"**
5. Se houver um link para a sessão, clique nele
6. O Session ID aparecerá na URL ou no topo da página

## Método 5: Via Stripe CLI (para desenvolvedores)

Se você tem o Stripe CLI instalado:

```bash
stripe events list --limit 10
```

Procure por eventos do tipo `checkout.session.completed` e veja o `id` no objeto `data.object`.

## Formato do Session ID

- **Test mode**: Começa com `cs_test_`
- **Live mode**: Começa com `cs_live_`
- Exemplo completo: `cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0`

## Usar o Session ID

Os pagamentos são processados automaticamente quando você retorna do Stripe. Se por algum motivo o pagamento não foi processado, você pode usar o endpoint da API diretamente ou entrar em contato com o suporte.

## Dica

Se você acabou de fazer um pagamento e os créditos não foram adicionados:
- Verifique a URL do dashboard - o Session ID já está lá!
- Ou clique no botão "Verify Payment" na notificação que aparece

