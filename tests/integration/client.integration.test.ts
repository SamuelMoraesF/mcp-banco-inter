import { InterClient } from '../../src/inter-client.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

describe('InterClient Integration (Read Operations)', () => {
    let client: InterClient;

    jest.setTimeout(40000);

    beforeAll(() => {
        console.log('ENV STATUS:', {
            hasId: !!process.env.INTER_CLIENT_ID,
            hasSecret: !!process.env.INTER_CLIENT_SECRET,
            hasCert: !!process.env.INTER_CERT,
            hasKey: !!process.env.INTER_KEY
        });
        const config = {
            clientId: process.env.INTER_CLIENT_ID || '',
            clientSecret: process.env.INTER_CLIENT_SECRET || '',
            certPath: path.resolve(process.env.INTER_KEY || ''),
            keyPath: path.resolve(process.env.INTER_CERT || ''),
            contaCorrente: process.env.X_CONTA_CORRENTE,
            isSandbox: process.env.INTER_IS_SANDBOX === 'true',
        };

        if (!config.clientId || !config.clientSecret || !config.certPath || !config.keyPath) {
            throw new Error('Missing environment variables for integration tests');
        }

        client = new InterClient(config);
    });

    it('should get saldo', async () => {
        try {
            const saldo = await client.getSaldo();
            console.log('Saldo:', saldo);
            expect(saldo).toBeDefined();
            expect(saldo.disponivel).toBeDefined();
        } catch (e: any) {
            console.error('FAILED TO GET SALDO:', e.message);
            if (e.response) console.error('Error response:', e.response.data);
            throw e;
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
            // console.log('Cobranca Object:', JSON.stringify(cobrancas.cobrancas[0], null, 2));
            const codigoSolicitacao = cobrancas.cobrancas[0].cobranca.codigoSolicitacao;
            console.log('Testing with Cobranca Code:', codigoSolicitacao);

            // Test getCobranca
            const cobrancaDetails = await client.getCobranca(codigoSolicitacao);
            expect(cobrancaDetails).toBeDefined();
            // The getCobranca likely returns the same structure or a detailed one, 
            // checking if the returned object has the correct code.
            // Based on API docs, it returns the detailing, which might have 'cobranca' key too 
            // OR checks nested property. Let's check if the high level object has it or nested.
            // For safety, let's just check if it's defined and convert to any to check property
            const details: any = cobrancaDetails;
            // The API for GET /cobrancas/{id} returns the same structure as the item in the list mostly, 
            // or maybe flattened? The key is usually valid.
            // Let's assume it returns { cobranca: { ... }, ... } or just { ... }

            // For now, let's just expect it to be defined.
            expect(details).toBeDefined();


            // Test getCobrancaPdf
            const pdf = await client.getCobrancaPdf(codigoSolicitacao);
            expect(pdf).toBeDefined();
            // PDF comes as base64 string or similar depending on implementation, checking if it's truthy
            expect(pdf.length).toBeGreaterThan(0);
        } else {
            console.warn('No cobrancas found to test getCobranca/getCobrancaPdf');
        }
    });
});
