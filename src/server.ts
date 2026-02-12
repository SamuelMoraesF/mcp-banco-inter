import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { InterClient } from './inter-client.js';
import fs from 'fs-extra';
import path from 'path';
import {
    CobrancaQueryParams,
    EmitirCobrancaRequest,
    GetExtratoParams,
    GetPdfBoletoParams,
    CancelarBoletoParams,
} from './types.js';

export class InterMcpServer {
    private server: Server;
    private client: InterClient;
    private storagePath: string;

    constructor(client: InterClient, storagePath: string) {
        this.client = client;
        this.storagePath = storagePath;
        fs.ensureDirSync(storagePath);

        this.server = new Server(
            {
                name: 'mcp-banco-inter',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupTools();
    }

    private setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'consultar_saldo',
                    description: 'Consulta o saldo da conta corrente.',
                    inputSchema: { type: 'object', properties: {} },
                },
                {
                    name: 'consultar_extrato',
                    description: 'Consulta o extrato da conta em um período.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            dataInicial: { type: 'string', description: 'YYYY-MM-DD' },
                            dataFinal: { type: 'string', description: 'YYYY-MM-DD' },
                        },
                        required: ['dataInicial', 'dataFinal'],
                    },
                },
                {
                    name: 'listar_boletos',
                    description: 'Lista as cobranças (boletos) emitidas.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            dataInicial: { type: 'string', description: 'Data de vencimento inicial YYYY-MM-DD' },
                            dataFinal: { type: 'string', description: 'Data de vencimento final YYYY-MM-DD' },
                            situacao: { type: 'string', enum: ['RECEBIDO', 'A_RECEBER', 'ATRASADO', 'CANCELADO'] },
                        },
                        required: ['dataInicial', 'dataFinal'],
                    },
                },
                {
                    name: 'emitir_boleto',
                    description: 'Emite um novo boleto de cobrança.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            seuNumero: { type: 'string', maxLength: 15 },
                            valorNominal: { type: 'number', minimum: 2.5 },
                            dataVencimento: { type: 'string', description: 'YYYY-MM-DD' },
                            pagador: {
                                type: 'object',
                                properties: {
                                    cpfCnpj: { type: 'string' },
                                    tipoPessoa: { type: 'string', enum: ['FISICA', 'JURIDICA'] },
                                    nome: { type: 'string' },
                                    endereco: { type: 'string' },
                                    bairro: { type: 'string' },
                                    cidade: { type: 'string' },
                                    uf: { type: 'string' },
                                    cep: { type: 'string' },
                                },
                                required: ['cpfCnpj', 'tipoPessoa', 'nome', 'endereco', 'bairro', 'cidade', 'uf', 'cep'],
                            },
                        },
                        required: ['seuNumero', 'valorNominal', 'dataVencimento', 'pagador'],
                    },
                },
                {
                    name: 'baixar_pdf_boleto',
                    description: 'Gera e salva o PDF de um boleto pelo código de solicitação.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            codigoSolicitacao: { type: 'string' },
                        },
                        required: ['codigoSolicitacao'],
                    },
                },
                {
                    name: 'cancelar_boleto',
                    description: 'Cancela um boleto de cobrança.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            codigoSolicitacao: { type: 'string' },
                            motivo: { type: 'string' },
                        },
                        required: ['codigoSolicitacao', 'motivo'],
                    },
                },
                {
                    name: 'sumario_boletos',
                    description: 'Recupera o sumário de cobranças por período.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            dataInicial: { type: 'string', description: 'YYYY-MM-DD' },
                            dataFinal: { type: 'string', description: 'YYYY-MM-DD' },
                        },
                        required: ['dataInicial', 'dataFinal'],
                    },
                },
                {
                    name: 'baixar_pdf_extrato',
                    description: 'Gera e salva o PDF do extrato em um período.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            dataInicial: { type: 'string', description: 'YYYY-MM-DD' },
                            dataFinal: { type: 'string', description: 'YYYY-MM-DD' },
                        },
                        required: ['dataInicial', 'dataFinal'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case 'consultar_saldo':
                        return {
                            content: [{ type: 'text', text: JSON.stringify(await this.client.getSaldo(), null, 2) }],
                        };

                    case 'consultar_extrato': {
                        const args = request.params.arguments as unknown as GetExtratoParams;
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(await this.client.getExtrato(args.dataInicial, args.dataFinal), null, 2),
                                },
                            ],
                        };
                    }

                    case 'listar_boletos': {
                        const args = request.params.arguments as unknown as CobrancaQueryParams;
                        return {
                            content: [{ type: 'text', text: JSON.stringify(await this.client.listCobrancas(args), null, 2) }],
                        };
                    }

                    case 'emitir_boleto': {
                        const args = request.params.arguments as unknown as EmitirCobrancaRequest;
                        return {
                            content: [{ type: 'text', text: JSON.stringify(await this.client.emitirCobranca(args), null, 2) }],
                        };
                    }

                    case 'baixar_pdf_boleto': {
                        const args = request.params.arguments as unknown as GetPdfBoletoParams;
                        const pdfBase64 = await this.client.getCobrancaPdf(args.codigoSolicitacao);
                        const filePath = path.join(this.storagePath, `boleto_${args.codigoSolicitacao}.pdf`);
                        await fs.writeFile(filePath, Buffer.from(pdfBase64, 'base64'));
                        return { content: [{ type: 'text', text: `PDF do boleto salvo em: ${filePath}` }] };
                    }

                    case 'baixar_pdf_extrato': {
                        const args = request.params.arguments as unknown as GetExtratoParams;
                        const pdfBuffer = await this.client.getExtratoPdf(args.dataInicial, args.dataFinal);
                        const filePath = path.join(this.storagePath, `extrato_${args.dataInicial}_${args.dataFinal}.pdf`);
                        await fs.writeFile(filePath, pdfBuffer);
                        return { content: [{ type: 'text', text: `PDF do extrato salvo em: ${filePath}` }] };
                    }

                    case 'cancelar_boleto': {
                        const args = request.params.arguments as unknown as CancelarBoletoParams;
                        await this.client.cancelarCobranca(args.codigoSolicitacao, args.motivo);
                        return { content: [{ type: 'text', text: `Boleto ${args.codigoSolicitacao} cancelado com sucesso.` }] };
                    }

                    case 'sumario_boletos': {
                        const args = request.params.arguments as unknown as CobrancaQueryParams;
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(await this.client.getSumarioCobrancas(args), null, 2),
                                },
                            ],
                        };
                    }

                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: 'text', text: `Erro: ${errorMessage}` }],
                    isError: true,
                };
            }
        });
    }

    async connect(transport: any) {
        await this.server.connect(transport);
    }
}
