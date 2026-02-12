import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import { InterClient } from '../../src/inter-client.js';
import dotenv from 'dotenv';
import path from 'path';
import { AxiosError } from 'axios';
import { InterConfig } from '../../src/types.js';

dotenv.config();

describe('InterClient Integration (Read Operations)', () => {
    let client: InterClient;

    jest.setTimeout(40000);

    beforeAll(() => {
        console.log('ENV STATUS:', {
            hasId: !!process.env.INTER_CLIENT_ID,
            hasSecret: !!process.env.INTER_CLIENT_SECRET,
            hasCert: !!process.env.INTER_CERT,
            hasKey: !!process.env.INTER_KEY,
        });

        const clientId = process.env.INTER_CLIENT_ID || '';
        const clientSecret = process.env.INTER_CLIENT_SECRET || '';
        const certPath = process.env.INTER_CERT || '';
        const keyPath = process.env.INTER_KEY || '';

        if (!clientId || !clientSecret || !certPath || !keyPath) {
            throw new Error('Missing environment variables for integration tests');
        }

        const config: InterConfig = {
            clientId,
            clientSecret,
            certPath: path.resolve(certPath),
            keyPath: path.resolve(keyPath),
            contaCorrente: process.env.X_CONTA_CORRENTE,
            isSandbox: process.env.INTER_IS_SANDBOX === 'true',
        };

        client = new InterClient(config);
    });

    it('should get saldo', async () => {
        try {
            const saldo = await client.getSaldo();
            console.log('Saldo:', saldo);
            expect(saldo).toBeDefined();
            expect(saldo.disponivel).toBeDefined();
        } catch (e) {
            const error = e as AxiosError;
            console.error('FAILED TO GET SALDO:', error.message);
            if (error.response) console.error('Error response:', error.response.data);
            throw error;
        }
    });

    it('should get extrato', async () => {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const extrato = await client.getExtrato(sevenDaysAgo, today);
        console.log('Extrato count:', extrato.transacoes?.length || 0);
        expect(extrato).toBeDefined();
    });

    it('should get extrato PDF', async () => {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const pdf = await client.getExtratoPdf(sevenDaysAgo, today);
        expect(pdf).toBeDefined();
        expect(pdf.length).toBeGreaterThan(0);
    });

    it('should list cobrancas', async () => {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const cobrancas = await client.listCobrancas({
            dataInicial: thirtyDaysAgo,
            dataFinal: today,
        });
        console.log('Cobrancas count:', cobrancas.cobrancas?.length || 0);
        expect(cobrancas).toBeDefined();
    });

    it('should get sumario cobrancas', async () => {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sumario = await client.getSumarioCobrancas({
            dataInicial: thirtyDaysAgo,
            dataFinal: today,
        });
        expect(sumario).toBeDefined();
    });

    it('should get cobranca details and PDF', async () => {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // First list cobrancas to get a valid ID
        const cobrancas = await client.listCobrancas({
            dataInicial: thirtyDaysAgo,
            dataFinal: today,
        });

        if (cobrancas.cobrancas && cobrancas.cobrancas.length > 0) {
            const codigoSolicitacao = cobrancas.cobrancas[0].cobranca.codigoSolicitacao;
            console.log('Testing with Cobranca Code:', codigoSolicitacao);

            // Test getCobranca
            const cobrancaDetails = await client.getCobranca(codigoSolicitacao);
            expect(cobrancaDetails).toBeDefined();
            expect(cobrancaDetails.cobranca.codigoSolicitacao).toEqual(codigoSolicitacao);

            // Test getCobrancaPdf
            const pdf = await client.getCobrancaPdf(codigoSolicitacao);
            expect(pdf).toBeDefined();
            expect(pdf.length).toBeGreaterThan(0);
        } else {
            console.warn('No cobrancas found to test getCobranca/getCobrancaPdf');
        }
    });
});
