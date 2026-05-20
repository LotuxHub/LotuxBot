# ⚡ Lotux Bot v1.0.0

Bot de verificação para Discord com sistema de código via DM.

---

## 📁 Estrutura

```
lotux-bot/
├── src/
│   ├── index.js                  # Entry point do bot
│   ├── deploy-commands.js        # Registra slash commands
│   ├── commands/
│   │   └── verify.js             # Comando /verify
│   ├── events/
│   │   ├── ready.js              # Evento de login
│   │   └── interactionCreate.js  # Botões, modais, comandos
│   └── utils/
│       └── codeManager.js        # Geração e validação de código
├── api/
│   ├── server.js                 # Express API
│   └── routes/
│       ├── status.js             # GET /api/status
│       └── verify.js             # GET /api/verify/pending
├── public/
│   └── index.html                # Dashboard de status
├── render.yaml                   # Config de deploy no Render
├── .env.example                  # Exemplo de variáveis de ambiente
└── package.json
```

---

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env e coloque seu DISCORD_TOKEN
```

### 3. Registrar os slash commands
```bash
node src/deploy-commands.js
```

### 4. Iniciar o bot
```bash
npm start
```

---

## 🌐 Deploy no Render

1. Faça push do projeto para um repositório GitHub
2. Acesse [render.com](https://render.com) e clique em **New > Web Service**
3. Conecte seu repositório
4. O `render.yaml` já configura tudo automaticamente
5. **Apenas preencha o `DISCORD_TOKEN`** no painel de Environment Variables

---

## 🔄 Fluxo de Verificação

```
Usuário digita /verify
        ↓
Bot envia embed com botão [Verify]
        ↓
Usuário clica [Verify]
        ↓
Bot gera código → envia DM ao usuário
Bot envia mensagem ephemeral com botão [Send Code]
        ↓
Usuário clica [Send Code]
        ↓
Abre modal para digitar o código
        ↓
Bot valida o código
        ↓
✅ Dá cargo "Verificado" ao usuário
```

---

## 📡 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/status` | Status do bot |
| GET | `/api/verify/pending` | Verificações pendentes (requer `x-api-secret`) |

---

## ⚙️ Configurações

No Discord, crie um cargo chamado **`Verificado`** (ou `Verified`) — o bot o atribuirá automaticamente após a verificação bem-sucedida.

> O bot precisa ter permissão de **Gerenciar Cargos** e o cargo do bot deve estar **acima** do cargo `Verificado` na hierarquia.
