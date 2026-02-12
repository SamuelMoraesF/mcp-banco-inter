#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'crypto';
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
    console.error(
        'As variáveis de ambiente CLIENT_ID, CLIENT_SECRET, CERT_PATH e KEY_PATH são obrigatórias.'
    );
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
    } else if (MCP_TRANSPORT === 'streamable-http') {
        const app = express();
        app.use(express.json());

        const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: InterMcpServer }>();

        app.all('/mcp', async (req, res) => {
            const sessionId = req.headers['mcp-session-id'] as string | undefined;

            if (sessionId && sessions.has(sessionId)) {
                // Existing session — reuse transport
                const session = sessions.get(sessionId)!;
                await session.transport.handleRequest(req, res, req.body);
                return;
            }

            // Check if this is an initialization request
            const body = req.body;
            const isInit = Array.isArray(body)
                ? body.some((msg: any) => msg.method === 'initialize')
                : body?.method === 'initialize';

            if (req.method === 'POST' && isInit) {
                // New session
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                });

                const sessionServer = new InterMcpServer(client, path.resolve(STORAGE_PATH));

                transport.onclose = () => {
                    if (transport.sessionId) {
                        sessions.delete(transport.sessionId);
                    }
                };

                await sessionServer.connect(transport);
                await transport.handleRequest(req, res, req.body);

                if (transport.sessionId) {
                    sessions.set(transport.sessionId, { transport, server: sessionServer });
                }
            } else {
                // No valid session and not an init request
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: { code: -32000, message: 'Bad Request: No valid session. Send an initialize request first.' },
                    id: null,
                });
            }
        });

        const port = parseInt(MCP_PORT);
        app.listen(port, MCP_HOST, () => {
            console.error(`MCP Server running on http://${MCP_HOST}:${port}/mcp`);
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
