import 'mocha';

import assert from 'assert';

import { Client, Server } from '..';
import { RpcServer, Transport } from '../types';

function createPlainTransport (server: RpcServer): Transport {
    return async (body: string) => {
        const ret = await server.handle(body)
        return JSON.stringify(ret)
    }
}

describe('rpc:client:test', () => {
    const server = new Server()
    server.expose('hello', (m: string) => 'hello world ' + m)
    server.expose('triggerError', () => { throw new Error('e') })
    const transport = createPlainTransport(server)
    const client = new Client(transport)
    it('test invoke', async () => {
        const ret = await client.invoke('hello', 'mike')
        assert(ret, 'hello world mike')
    });
    it('test method not found', async () => {
        try {
            await client.invoke('method')
            assert(false, 'should not access')
        } catch (e) {
            assert(e.code === -32601, 'code not equal')
        }
    });
    it('test internal errlr', async () => {
        try {
            await client.invoke('triggerError')
            assert(false, 'should not access')
        } catch (e) {
            assert(e.code === -32603, 'code not equal')
        }
    });
    it('test batch call', async () => {
        const ret = await client.batch().invoke('hello', 'one')
            .notify('hello', 'two')
            .execute()
        assert(Array.isArray(ret), 'should return array')
        assert(ret.length === 1, 'should length = 1')

    });
    it('test invoke through as', async () => {
        const ret = await client.as<any>().hello('mike')
        assert(ret, 'hello world mike')
    });
});
