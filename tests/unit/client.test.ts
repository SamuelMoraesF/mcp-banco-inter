import { InterClient } from '../../src/inter-client.js';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('axios');

describe('InterClient', () => {
    const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        certPath: 'test.crt',
        keyPath: 'test.key',
        isSandbox: true,
    };

    beforeEach(() => {
        (fs.readFileSync as jest.Mock).mockReturnValue('dummy-cert-or-key');
    });

    it('should be instantiated correctly', () => {
        const client = new InterClient(config);
        expect(client).toBeDefined();
    });
});
