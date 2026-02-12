# MCP Banco Inter

Um Servidor MCP (Model Context Protocol) para integração com o Banco Inter Empresas (PJ).

## Funcionalidades

- **Cobranaças (Boletos):** Listar, emitir, cancelar, detalhar, sumário e baixar PDF.
- **Banking:** Consulta de saldo e extrato.

## Requisitos

- Node.js 18+ ou Docker.
- Certificado (.crt) e Chave Privada (.key) do Banco Inter (obtidos no Portal do Desenvolvedor).

## Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```env
CLIENT_ID=seu_client_id
CLIENT_SECRET=seu_client_secret
CERT_PATH=./certs/inter.crt
KEY_PATH=./certs/inter.key
X_CONTA_CORRENTE=sua_conta
STORAGE_PATH=./storage
MCP_TRANSPORT=stdio
INTER_IS_SANDBOX=true
```

## Instalação e Uso

### Via npx

```bash
npx mcp-banco-inter
```

### Manualmente

```bash
npm install
npm run build
npm start
```

### Docker

```bash
docker build -t mcp-banco-inter .
docker run -p 3000:3000 --env-file .env mcp-banco-inter
```

## Ferramentas Disponíveis

| Nome | Descrição |
| --- | --- |
| `consultar_saldo` | Retorna o saldo disponível. |
| `consultar_extrato` | Retorna as movimentações em um período. |
| `listar_boletos` | Lista cobranças emitidas. |
| `emitir_boleto` | Cria um novo boleto/PIX cobrança. |
| `baixar_pdf_boleto` | Gera o PDF do boleto e salva localmente. |
| `cancelar_boleto` | Cancela uma cobrança. |
| `sumario_boletos` | Resumo de cobranças por período. |
| `enviar_pix` | Realiza uma transferência PIX. |

## Licença

ISC
