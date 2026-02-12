import { InterClient } from './src/inter-client.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    clientId: process.env.INTER_CLIENT_ID || '',
    clientSecret: process.env.INTER_CLIENT_SECRET || '',
    certPath: path.resolve('keys/cert.crt'),
    keyPath: path.resolve('keys/key.key'),
    isSandbox: true,
};

async function test() {
    console.log('Starting connectivity test...');
    console.log('Config:', { ...config, clientSecret: '***' });
    const client = new InterClient(config);
    try {
        console.log('Requesting Saldo (will trigger authentication)...');
        const saldo = await client.getSaldo();
        console.log('SUCCESS! Saldo:', saldo);
    } catch (e: any) {
        console.error('ERROR during test:', e.message);
        if (e.response) {
            console.error('Response status:', e.response.status);
            console.error('Response data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
