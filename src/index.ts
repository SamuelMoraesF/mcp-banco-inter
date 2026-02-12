#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import dotenv from 'dotenv';
import { InterClient } from './inter-client.js';
import { InterMcpServer } from './server.js';
import path from 'path';

dotenv.config();

const {
    CLIENT_ID,
    CLIENT_SECRET,
    CERT_PATH,
    KEY_PATH,
    X_CONTA_CORRENTE,
    STORAGE_PATH = './storage',
    MCP_TRANSPORT = 'stdio',
    MCP_HOST = '0.0.0.0',
    MCP_PORT = '3000',
    INTER_IS_SANDBOX = 'false',
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
    console.error('As variáveis de ambiente CLIENT_ID, CLIENT_SECRET, CERT_PATH e KEY_PATH são obrigatórias.');
    process.exit(1);
}

const config = {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    certPath: path.resolve(CERT_PATH),
    keyPath: path.resolve(KEY_PATH),
    contaCorrente: X_CONTA_CORRENTE,
    isSandbox: INTER_IS_SANDBOX === 'true',
};

const client = new InterClient(config);
const mcpServer = new InterMcpServer(client, path.resolve(STORAGE_PATH));

async function main() {
    if (MCP_TRANSPORT === 'stdio') {
        const transport = new StdioServerTransport();
        await mcpServer.connect(transport);
        console.error('MCP Server running on stdio');
    } else if (MCP_TRANSPORT === 'streamable-http' || MCP_TRANSPORT === 'sse') {
        const app = express();
        app.use(express.json());
        let transport: SSEServerTransport | null = null;

        app.get('/sse', async (req, res) => {
            transport = new SSEServerTransport('/message', res);
            await mcpServer.connect(transport);
        });

        app.post('/message', async (req, res) => {
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(400).send('Session not initialized');
            }
        });

        const port = parseInt(MCP_PORT);
        app.listen(port, MCP_HOST, () => {
            console.error(`MCP Server running on http://${MCP_HOST}:${port}/sse`);
        });
    } else {
        console.error(`Transporte inválido: ${MCP_TRANSPORT}`);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Fatal error in main:', error);
    process.exit(1);
});
