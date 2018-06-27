import 'mocha';

import assert from 'assert';

import { Client, Server } from '..';
import { JsonRpcNotify, JsonRpcRequest, RpcServer, Transport } from '../types';

class PlainTransport implements Transport {
    constructor(protected server: RpcServer) {

    }
    async invoke (body: JsonRpcRequest | JsonRpcNotify[]) {
        const ret = await this.server.handle(body)
        return JSON.stringify(ret)
    }
    notify (body: JsonRpcNotify | JsonRpcNotify[]): void {
        this.server.handle(body).catch(console.log)
    }
}

describe('rpc:client:test', () => {
    const server = new Server()
    server.expose('hello', (m: string) => 'hello world ' + m)
    server.expose('triggerError', () => { throw new Error('e') })
    const transport = new PlainTransport(server)
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
