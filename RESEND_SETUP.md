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

**Para o domínio `podbrief.online`:**

1. Acesse o painel do Resend: [Domains](https://resend.com/domains)
2. Clique em **"Add Domain"**
3. Digite seu domínio: `podbrief.online` (sem www)
4. Clique em **"Add"**
5. O Resend irá gerar os registros DNS necessários. Você verá uma lista com:

   - **SPF record** (TXT) - para autenticação de email
   - **DKIM records** (CNAME) - geralmente 2 registros para verificação
   - **DMARC record** (TXT) - opcional, mas recomendado para segurança

6. **Adicione os registros DNS no seu provedor de domínio:**

   - Acesse o painel de DNS do seu provedor (onde você comprou o domínio)
   - Adicione cada registro exatamente como mostrado no Resend
   - **Importante**: Os registros CNAME do DKIM podem levar alguns minutos para propagar

7. **Aguarde a verificação:**

   - O Resend verifica automaticamente os registros DNS
   - Pode levar de alguns minutos até 24 horas para propagar
   - Você pode verificar o status na página de Domains do Resend
   - Quando estiver verificado, o status mudará para "Verified" (verificado)

8. **Após verificação, configure o email do remetente:**
   - Use um endereço como: `noreply@podbrief.online` ou `hello@podbrief.online`
   - Adicione ao seu arquivo `.env`:
     ```env
     RESEND_FROM_EMAIL=noreply@podbrief.online
     ```

**Dica**: Se você já tem outros registros DNS no seu domínio, certifique-se de não criar conflitos. O Resend mostrará exatamente quais registros adicionar.

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

#### 5. Email do Formulário de Contato

- **Quando**: Quando um usuário envia mensagem através do formulário de contato
- **Local**: `app/api/contact/route.ts`
- **Destino**: `support@podbrief.online`
- **Conteúdo**: Nome, email, assunto e mensagem do usuário
- **Reply-To**: Email do usuário (permite responder diretamente)

### 4. Testar os Emails

1. Certifique-se de que as variáveis de ambiente estão configuradas
2. Reinicie o servidor: `npm run dev`
3. Teste cada fluxo:
   - Criar nova conta → Email de boas-vindas
   - Comprar créditos → Email de confirmação
   - Usar créditos até ficar < 10 → Email de créditos baixos
   - Deletar conta → Email de despedida
   - Enviar mensagem pelo formulário de contato → Email para support@podbrief.online

### 5. Monitoramento

- Acesse [Logs](https://resend.com/emails) no Resend para ver o status dos emails
- Verifique os logs do servidor para erros de envio
- Emails são enviados de forma assíncrona e não bloqueiam as operações principais

### 6. Troubleshooting - Formulário de Contato

Se você não está recebendo emails do formulário de contato em `support@podbrief.online`:

#### Passo 1: Verificar os Logs do Servidor

1. Envie uma mensagem pelo formulário de contato
2. Verifique os logs do servidor (terminal onde está rodando `npm run dev`)
3. Procure por mensagens como:
   - `📧 Sending contact form email:` - confirma que está tentando enviar
   - `✅ Contact form email sent successfully` - confirma sucesso
   - `❌ Error sending contact form email:` - indica erro

#### Passo 2: Verificar no Painel do Resend

1. Acesse [Resend Emails](https://resend.com/emails)
2. Procure por emails enviados recentemente
3. Verifique o status de cada email:
   - ✅ **Delivered** - Email foi entregue (pode estar em spam)
   - ⚠️ **Bounced** - Email foi rejeitado
   - ❌ **Failed** - Falha no envio

#### Passo 3: Configurar Recebimento de Emails para `support@podbrief.online`

**⚠️ IMPORTANTE:** O Resend **envia** emails, mas **não recebe** emails. Você precisa configurar onde os emails enviados para `support@podbrief.online` devem ser entregues.

##### Opção A: Usar Encaminhamento de Email (Recomendado)

Se você já tem um email pessoal (Gmail, Outlook, etc.), configure o encaminhamento:

1. **No seu provedor de domínio** (onde você comprou o domínio):

   - Acesse as configurações de email/email forwarding
   - Configure para encaminhar `support@podbrief.online` → `seu-email@gmail.com` (ou outro email)
   - Salve as alterações

2. **Alternativa - Usar Gmail com domínio personalizado:**
   - Configure o Gmail para receber emails de `podbrief.online`
   - Adicione `support@podbrief.online` como alias no Gmail
   - Configure os registros MX do domínio para apontar para o Gmail

##### Opção B: Usar Serviço de Email Profissional

Configure um serviço de email profissional para o domínio:

1. **Google Workspace** (antigo G Suite):

   - Configure os registros MX do domínio
   - Crie a conta `support@podbrief.online`
   - Os emails serão entregues normalmente

2. **Microsoft 365 / Outlook:**

   - Configure os registros MX do domínio
   - Crie a conta `support@podbrief.online`

3. **Outros provedores:**
   - Zoho Mail, ProtonMail Business, etc.
   - Siga as instruções de cada serviço para configurar os registros MX

##### Opção C: Verificar Registros MX do Domínio

Os registros MX (Mail Exchange) determinam onde os emails do domínio são entregues:

1. Verifique os registros MX atuais do domínio:

   ```bash
   # No terminal, execute:
   dig MX podbrief.online
   # ou use ferramentas online como: https://mxtoolbox.com/
   ```

2. Se não houver registros MX configurados, os emails não serão entregues
3. Configure os registros MX apontando para o seu provedor de email

##### Verificar Status no Resend

1. Acesse [Resend Emails](https://resend.com/emails)
2. Clique no email enviado para ver detalhes
3. Verifique o status:
   - **"Delivered"** = Email foi entregue ao servidor de destino (pode estar em spam ou não configurado)
   - **"Bounced"** = Email foi rejeitado (verifique os registros MX)
   - **"Failed"** = Falha no envio

#### Passo 5: Testar com Outro Email (Solução Temporária)

Para testar se o problema é específico do `support@podbrief.online`, você pode temporariamente mudar o destino:

1. Adicione ao `.env`:

   ```env
   SUPPORT_EMAIL=seu-email-pessoal@gmail.com
   ```

2. Teste novamente o formulário

3. Se funcionar, confirma que o problema está na configuração de recebimento do `support@podbrief.online`

#### Passo 4: Verificar Pasta de Spam

- Verifique a pasta de spam/lixo eletrônico do email de destino (se configurou encaminhamento)
- Marque como "Não é spam" se encontrar os emails lá
- Adicione `noreply@podbrief.online` à lista de contatos confiáveis

#### Passo 6: Solução Rápida - Usar Email Pessoal Temporariamente

Se você precisa receber os emails imediatamente enquanto configura o `support@podbrief.online`:

1. Adicione ao `.env`:

   ```env
   SUPPORT_EMAIL=seu-email-pessoal@gmail.com
   ```

2. Reinicie o servidor

3. Os emails do formulário serão enviados para seu email pessoal

4. Depois que configurar o recebimento de emails para `support@podbrief.online`, remova essa variável ou altere para `support@podbrief.online`

#### Passo 7: Verificar Erros Específicos

Se os logs mostram erros, verifique:

- **"Invalid 'to' field"** - O endereço de email está incorreto
- **"Domain not verified"** - O domínio precisa ser verificado primeiro
- **"Rate limit exceeded"** - Você excedeu o limite de emails
- **"Forbidden"** - Problema com a API key ou permissões

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
    contact-form.ts           # Email do formulário de contato
app/
  api/
    contact/
      route.ts                 # API route para receber formulário de contato
```

## Notas Importantes

- Todos os emails são enviados de forma **assíncrona** e não bloqueiam as operações principais
- Erros no envio de emails são logados mas não interrompem o fluxo
- O email de créditos baixos só é enviado quando os créditos ficam < 10 após uma transcrição
- Para produção, certifique-se de verificar seu domínio no Resend
- O email do formulário de contato é enviado para `support@podbrief.online` e inclui o email do remetente no campo Reply-To, permitindo responder diretamente ao usuário
