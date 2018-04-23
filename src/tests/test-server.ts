import 'mocha';

import assert from 'assert';

import { Server } from '..';
import { JsonRpcRequest, JsonRpcResponse } from '../types';



describe('rpc:server:test', () => {
    const server = new Server()
    server.expose('hello', (m: string) => 'hello world ' + m)
    server.expose('triggerError', () => { throw new Error('e') })
    it('test simple invoke', async () => {
        const call = {
            jsonrpc: '2.0',
            id: 1,
            method: 'hello'
        } as JsonRpcRequest
        const ret = await server.handle(call)
        assert(ret.result, 'hello world mike')
    });
    it('test method not found', async () => {
        const call = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'notexist'
        })
        const res = await server.handle(call) as any
        assert(res.error.code, 'should not access')

    });
    it('test notify', async () => {
        const call = JSON.stringify({
            jsonrpc: '2.0',
            method: 'hello'
        })
        const ret = await server.handle(call)
        assert(!ret, 'hello world mike')
    });
    it('test mixed batch', async () => {
        const call = JSON.stringify([
            {
                jsonrpc: '2.0',
                method: 'hello'
            },
            {
                jsonrpc: '2.0',
                id: 1,
                method: 'notexist'
            },
            {
                jsonrpc: '2.0',
                id: 1,
                method: 'hello'
            }
        ])
        const ret = await server.handle(call) as JsonRpcResponse[]
        assert(Array.isArray(ret), 'response should be array')
        assert(ret.length === 2, 'response should be length = 2')
    });
    it('test notify batch', async () => {
        const call = JSON.stringify([
            {
                jsonrpc: '2.0',
                method: 'hello'
            },
            {
                jsonrpc: '2.0',
                method: 'hello'
            },
        ])
        const ret = await server.handle(call)
        assert(!ret, 'response should be undefined')
    });
});
