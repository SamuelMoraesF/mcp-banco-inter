import axios, { AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';
import { InterConfig, AuthResponse, SaldoResponse, ExtratoResponse, ListCobrancasResponse } from './types.js';

export class InterClient {
    private axiosInstance: AxiosInstance;
    private token: string | null = null;
    private tokenExpiresAt: number = 0;
    private config: InterConfig;

    constructor(config: InterConfig) {
        this.config = config;
        const cert = fs.readFileSync(config.certPath);
        const key = fs.readFileSync(config.keyPath);

        const httpsAgent = new https.Agent({
            cert,
            key,
            rejectUnauthorized: false, // Often needed for Inter's sandbox/certs in some environments
        });

        const baseURL = config.isSandbox
            ? 'https://cdpj-sandbox.partners.uatinter.co'
            : 'https://cdpj.partners.bancointer.com.br';

        this.axiosInstance = axios.create({
            baseURL,
            httpsAgent,
            timeout: 30000,
        });
        console.log(`InterClient initialized with baseURL: ${baseURL}`);
    }

    private async authenticate(): Promise<string> {
        const now = Date.now();
        if (this.token && now < this.tokenExpiresAt) {
            return this.token;
        }

        const data = new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: 'client_credentials',
            scope: 'boleto-cobranca.read boleto-cobranca.write extrato.read saldo.read',
        });

        console.log('Authenticating with Inter API...');
        try {
            const response = await this.axiosInstance.post<AuthResponse>('/oauth/v2/token', data.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            this.token = response.data.access_token;
            this.tokenExpiresAt = now + (response.data.expires_in - 60) * 1000; // Buffer of 60 seconds
            console.log('Successfully authenticated with Inter API');
            return this.token;
        } catch (error: any) {
            console.error('AUTHENTICATION ERROR:', error.message);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    private async getHeaders() {
        const token = await this.authenticate();
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
        };
        if (this.config.contaCorrente) {
            headers['x-conta-corrente'] = this.config.contaCorrente;
        }
        return headers;
    }

    async getSaldo(): Promise<SaldoResponse> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get<SaldoResponse>('/banking/v2/saldo', { headers });
        return response.data;
    }

    async getExtrato(dataInicial: string, dataFinal: string): Promise<ExtratoResponse> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get<ExtratoResponse>('/banking/v2/extrato', {
            headers,
            params: { dataInicio: dataInicial, dataFim: dataFinal },
        });
        return response.data;
    }

    async getExtratoPdf(dataInicial: string, dataFinal: string): Promise<Buffer> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get('/banking/v2/extrato/exportar', {
            headers,
            params: { dataInicio: dataInicial, dataFim: dataFinal },
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    }

    async listCobrancas(params: any): Promise<ListCobrancasResponse> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get<ListCobrancasResponse>('/cobranca/v3/cobrancas', {
            headers,
            params,
        });
        return response.data;
    }

    async emitirCobranca(data: any): Promise<{ codigoSolicitacao: string }> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.post('/cobranca/v3/cobrancas', data, { headers });
        return response.data;
    }

    async getCobranca(codigoSolicitacao: string): Promise<any> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get(`/cobranca/v3/cobrancas/${codigoSolicitacao}`, { headers });
        return response.data;
    }

    async getCobrancaPdf(codigoSolicitacao: string): Promise<string> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get(`/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`, { headers });
        return response.data.pdf;
    }

    async cancelarCobranca(codigoSolicitacao: string, motivo: string): Promise<void> {
        const headers = await this.getHeaders();
        await this.axiosInstance.post(`/cobranca/v3/cobrancas/${codigoSolicitacao}/cancelar`, { motivoCancelamento: motivo }, { headers });
    }

    async editarCobranca(codigoSolicitacao: string, data: any): Promise<any> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.patch(`/cobranca/v3/cobrancas/${codigoSolicitacao}`, data, { headers });
        return response.data;
    }

    async getSumarioCobrancas(params: any): Promise<any[]> {
        const headers = await this.getHeaders();
        const response = await this.axiosInstance.get('/cobranca/v3/cobrancas/sumario', {
            headers,
            params,
        });
        return response.data;
    }

}
