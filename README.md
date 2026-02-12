# 🏦 MCP Banco Inter

[![NPM Version](https://img.shields.io/npm/v/samuelmoraesf/mcp-banco-inter)](https://www.npmjs.com/package/samuelmoraesf/mcp-banco-inter)
[![Docker Image](https://img.shields.io/docker/v/samuelmoraesf/mcp-banco-inter?label=docker)](https://hub.docker.com/r/samuelmoraesf/mcp-banco-inter)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Um servidor **[MCP (Model Context Protocol)](https://modelcontextprotocol.io/)** para integração com a API do **Banco Inter Empresas (PJ)**.

Permite que assistentes de IA (como Claude, ChatGPT, Gemini, etc.) consultem saldos, extratos, emitam e gerenciem boletos de cobrança — tudo via linguagem natural.

---

## ✨ Funcionalidades

### Banking
- 💰 Consulta de **saldo** da conta corrente
- 📊 Consulta de **extrato** por período
- 📄 Download de **extrato em PDF**

### Cobranças (Boletos)
- 📋 **Listar** cobranças emitidas com filtros (situação, período)
- 🆕 **Emitir** novos boletos de cobrança
- ❌ **Cancelar** cobranças
- 📊 **Sumário** de cobranças por período
- 📥 **Baixar PDF** de boletos

---

## 📋 Pré-requisitos

- **Node.js 18+** ou **Docker**
- Credenciais de API do Banco Inter (obtidas no [Portal do Desenvolvedor Inter](https://developers.inter.co/)):
  - `CLIENT_ID` e `CLIENT_SECRET`
  - Certificado digital (`.crt`) e Chave Privada (`.key`)
  - Número da Conta Corrente

---

## ⚙️ Configuração

**1.** Obtenha suas credenciais no [Portal do Desenvolvedor do Banco Inter](https://developers.inter.co/)

**2.** Coloque os arquivos de certificado em um diretório seguro (ex.: `./certs/`)

**3.** Crie um arquivo `.env` baseado no `.env.example`:

```env
# Credenciais obrigatórias
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
CERT_PATH=./certs/inter.crt
KEY_PATH=./certs/inter.key

# Conta
X_CONTA_CORRENTE=123456789

# Armazenamento local (PDFs gerados)
STORAGE_PATH=./storage

# Transporte MCP: "stdio" | "streamable-http"
MCP_TRANSPORT=stdio

# Configurações de rede (apenas para transporte streamable-http)
MCP_HOST=0.0.0.0
MCP_PORT=3000

# Sandbox (para testes)
INTER_IS_SANDBOX=true
```

> ⚠️ **Importante:** Nunca comite os arquivos `.env`, `.crt` e `.key` no repositório. Eles já estão no `.gitignore`.

---

## 🚀 Instalação e Uso

O servidor suporta dois modos de transporte:

| Transporte | Uso | Ideal para |
|---|---|---|
| **`stdio`** | Comunicação via stdin/stdout | Clientes locais (Claude Desktop, Cursor, etc.) |
| **`streamable-http`** | Servidor HTTP com Streamable HTTP | Clientes remotos, Docker, múltiplos clientes |

---

### 1️⃣ Via `npx` — Modo `stdio` (recomendado para clientes locais)

O modo padrão. O cliente MCP inicia o processo e se comunica via stdin/stdout:

```bash
CLIENT_ID=seu_client_id \
CLIENT_SECRET=seu_client_secret \
CERT_PATH=/caminho/absoluto/inter.crt \
KEY_PATH=/caminho/absoluto/inter.key \
X_CONTA_CORRENTE=sua_conta \
INTER_IS_SANDBOX=true \
npx -y samuelmoraesf/mcp-banco-inter
```

> 💡 Na prática, você não roda manualmente — o cliente MCP (Claude Desktop, Cursor, etc.) executará o comando automaticamente. Veja os exemplos de configuração abaixo.

---

### 2️⃣ Via `npx` — Modo `streamable-http` (servidor HTTP)

Para rodar como servidor HTTP acessível por múltiplos clientes:

```bash
CLIENT_ID=seu_client_id \
CLIENT_SECRET=seu_client_secret \
CERT_PATH=/caminho/absoluto/inter.crt \
KEY_PATH=/caminho/absoluto/inter.key \
X_CONTA_CORRENTE=sua_conta \
INTER_IS_SANDBOX=true \
MCP_TRANSPORT=streamable-http \
MCP_HOST=0.0.0.0 \
MCP_PORT=3000 \
npx -y samuelmoraesf/mcp-banco-inter
```

O servidor estará disponível em:
```
http://localhost:3000/mcp
```

---

### 3️⃣ Via Docker — Modo `streamable-http`

O container Docker já vem configurado para rodar em modo `streamable-http` por padrão.

**Build local:**

```bash
docker build -t mcp-banco-inter .

docker run -d \
  --name mcp-banco-inter \
  -p 3000:3000 \
  -e CLIENT_ID=seu_client_id \
  -e CLIENT_SECRET=seu_client_secret \
  -e X_CONTA_CORRENTE=sua_conta \
  -e INTER_IS_SANDBOX=true \
  -v /caminho/absoluto/certs:/app/certs \
  -e CERT_PATH=/app/certs/inter.crt \
  -e KEY_PATH=/app/certs/inter.key \
  mcp-banco-inter
```

**Ou diretamente do Docker Hub:**

```bash
docker run -d \
  --name mcp-banco-inter \
  -p 3000:3000 \
  --env-file .env \
  -v ./certs:/app/certs \
  samuelmoraesf/mcp-banco-inter:latest
```

> O container expõe o endpoint Streamable HTTP em `http://localhost:3000/mcp`.

---

### 4️⃣ Instalação local (desenvolvimento)

```bash
git clone https://github.com/samuelmoraesf/mcp-banco-inter.git
cd mcp-banco-inter
npm install
npm run build
npm start
```

---

## 🔌 Integração com Clientes MCP

### Claude Desktop (stdio)

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "banco-inter": {
      "command": "npx",
      "args": ["-y", "mcp-banco-inter"],
      "env": {
        "CLIENT_ID": "seu_client_id",
        "CLIENT_SECRET": "seu_client_secret",
        "CERT_PATH": "/caminho/absoluto/inter.crt",
        "KEY_PATH": "/caminho/absoluto/inter.key",
        "X_CONTA_CORRENTE": "sua_conta",
        "INTER_IS_SANDBOX": "true"
      }
    }
  }
}
```

### Cursor / Windsurf / VS Code (stdio)

Na configuração MCP do seu editor, adicione:

```json
{
  "mcp": {
    "servers": {
      "banco-inter": {
        "command": "npx",
        "args": ["-y", "mcp-banco-inter"],
        "env": {
          "CLIENT_ID": "seu_client_id",
          "CLIENT_SECRET": "seu_client_secret",
          "CERT_PATH": "/caminho/absoluto/inter.crt",
          "KEY_PATH": "/caminho/absoluto/inter.key",
          "X_CONTA_CORRENTE": "sua_conta",
          "INTER_IS_SANDBOX": "true"
        }
      }
    }
  }
}
```

### Clientes remotos (streamable-http)

Para clientes que se conectam via HTTP (incluindo Docker), primeiro inicie o servidor em modo `streamable-http` (veja seções 2️⃣ ou 3️⃣ acima) e configure o cliente para conectar ao endpoint:

```
http://localhost:3000/mcp
```

---

## 🛠️ Ferramentas Disponíveis

| Ferramenta | Descrição | Parâmetros |
|---|---|---|
| `consultar_saldo` | Retorna o saldo disponível da conta. | — |
| `consultar_extrato` | Retorna as movimentações em um período. | `dataInicial`, `dataFinal` |
| `baixar_pdf_extrato` | Gera e salva o PDF do extrato. | `dataInicial`, `dataFinal` |
| `listar_boletos` | Lista cobranças por período e situação. | `dataInicial`, `dataFinal`, `situacao?` |
| `emitir_boleto` | Cria um novo boleto de cobrança. | `seuNumero`, `valorNominal`, `dataVencimento`, `pagador` |
| `baixar_pdf_boleto` | Gera e salva o PDF de um boleto. | `codigoSolicitacao` |
| `cancelar_boleto` | Cancela uma cobrança existente. | `codigoSolicitacao`, `motivo` |
| `sumario_boletos` | Resumo quantitativo de cobranças por período. | `dataInicial`, `dataFinal` |

---

## 🏗️ Arquitetura

```
src/
├── index.ts          # Entrypoint — configura transporte (stdio/HTTP)
├── server.ts         # Definição do servidor MCP e registro das tools
├── inter-client.ts   # Cliente HTTP para a API do Banco Inter
└── types.ts          # Interfaces TypeScript das requisições/respostas
```

| Módulo | Responsabilidade |
|---|---|
| **`index.ts`** | Carrega variáveis de ambiente, inicializa o `InterClient` e o `InterMcpServer`, e configura o transporte (`stdio` ou `Streamable HTTP`). |
| **`server.ts`** | Registra as ferramentas MCP e delega chamadas ao `InterClient`. |
| **`inter-client.ts`** | Autenticação OAuth2 com mTLS, cache de token, e todas as chamadas REST à API Inter (Banking v2 e Cobrança v3). |
| **`types.ts`** | Tipagem completa de todas as interfaces usadas nas requisições e respostas da API. |

---

## 🧪 Testes

```bash
# Testes unitários
npm run test:unit

# Testes de integração (requer .env configurado)
npm run test:integration

# Todos os testes
npm test
```

---

## 📦 CI/CD

O projeto possui pipelines automatizados via **GitHub Actions**:

- **NPM Publish** — Publica automaticamente no NPM ao criar tags `v*`.
- **Docker Build & Push** — Builda e publica imagem multi-arch (`amd64`/`arm64`) no Docker Hub ao fazer push em `master` ou ao criar tags.

---

## 🔒 Segurança

- A comunicação com a API do Banco Inter é feita via **mTLS** (certificado digital do cliente).
- O token de autenticação OAuth2 é armazenado **apenas em memória** e renovado automaticamente.
- Os arquivos sensíveis (`.env`, certificados, chaves) estão incluídos no `.gitignore`.
