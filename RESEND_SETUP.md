# Configuração do Resend - PodBrief

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Resend API Key (obtida em https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email do remetente (use onboarding@resend.dev para testes ou seu domínio verificado)
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Passo a Passo para Configuração

### 1. Criar Conta no Resend

1. Acesse [Resend](https://resend.com) e crie uma conta
2. Vá para [API Keys](https://resend.com/api-keys)
3. Clique em "Create API Key"
4. Dê um nome (ex: "PodBrief Production")
5. Copie a API Key (começa com `re_`)
6. Adicione ao `.env`:
   ```env
   RESEND_API_KEY=re_xxxxx
   ```

### 2. Configurar Email do Remetente

#### Opção A: Usar domínio de teste (desenvolvimento)

- Use `onboarding@resend.dev` para testes
- Não requer verificação de domínio
- Limite de 100 emails/dia

#### Opção B: Verificar seu domínio (produção)

1. Vá para [Domains](https://resend.com/domains) no Resend
2. Clique em "Add Domain"
3. Adicione seu domínio (ex: `podbrief.com`)
4. Siga as instruções para adicionar os registros DNS:
   - SPF record
   - DKIM records
   - DMARC record (opcional)
5. Após verificação, use: `noreply@seudominio.com`
6. Adicione ao `.env`:
   ```env
   RESEND_FROM_EMAIL=noreply@seudominio.com
   ```

### 3. Emails Implementados

O sistema envia automaticamente os seguintes emails:

#### 1. Email de Boas-vindas

- **Quando**: Quando um novo usuário cria conta
- **Local**: `app/auth/callback/actions.ts`
- **Conteúdo**: Mensagem de boas-vindas com link para upload

#### 2. Email de Confirmação de Compra

- **Quando**: Após compra bem-sucedida de créditos
- **Local**: `app/api/webhooks/stripe/route.ts`
- **Conteúdo**: Detalhes da compra, créditos adicionados, novo saldo

#### 3. Email de Créditos Baixos

- **Quando**: Quando créditos ficam abaixo de 10 após uma transcrição
- **Local**: `app/api/upload/route.ts`
- **Conteúdo**: Alerta com saldo atual e link para comprar mais créditos

#### 4. Email de Despedida

- **Quando**: Quando usuário deleta a conta
- **Local**: `app/api/user/delete/route.ts`
- **Conteúdo**: Confirmação de exclusão e agradecimento

### 4. Testar os Emails

1. Certifique-se de que as variáveis de ambiente estão configuradas
2. Reinicie o servidor: `npm run dev`
3. Teste cada fluxo:
   - Criar nova conta → Email de boas-vindas
   - Comprar créditos → Email de confirmação
   - Usar créditos até ficar < 10 → Email de créditos baixos
   - Deletar conta → Email de despedida

### 5. Monitoramento

- Acesse [Logs](https://resend.com/emails) no Resend para ver o status dos emails
- Verifique os logs do servidor para erros de envio
- Emails são enviados de forma assíncrona e não bloqueiam as operações principais

## Estrutura dos Arquivos

```
lib/
  resend.ts                    # Configuração do Resend
  emails/
    index.ts                   # Exportações
    welcome.ts                 # Email de boas-vindas
    purchase-confirmation.ts   # Email de confirmação de compra
    low-credits.ts            # Email de créditos baixos
    goodbye.ts                # Email de despedida
```

## Notas Importantes

- Todos os emails são enviados de forma **assíncrona** e não bloqueiam as operações principais
- Erros no envio de emails são logados mas não interrompem o fluxo
- O email de créditos baixos só é enviado quando os créditos ficam < 10 após uma transcrição
- Para produção, certifique-se de verificar seu domínio no Resend
