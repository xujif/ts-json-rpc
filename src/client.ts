import debug from 'debug';

import {
    JsonRpcMixedBody,
    JsonRpcRequest,
    JsonRpcResponse,
    RemoteError,
    RpcClient,
    Transport,
    TransportError,
} from './types';

const _debug = debug('rpc-client')

export class Client implements RpcClient {

    protected id = 1

    /**
     * Creates an instance of Json Rpc 2.0 Client.
     * @param {Transport} transport 
     * @memberof Client
     */
    constructor(protected transport: Transport) {

    }

    /**
     * invoke remote method
     * 
     * @param {string} method 
     * @param {...any[]} params 
     * @returns 
     * @memberof Client
     */
    async invoke (method: string, ...params: any[]) {
        const reqId = this.id++
        const payload: JsonRpcRequest = {
            id: reqId,
            method,
            params,
            jsonrpc: '2.0'
        }
        let jsonResponse: string | undefined
        try {
            jsonResponse = await this.transport.invoke(payload)
        } catch (e) {
            throw new TransportError(e)
        }
        if (!jsonResponse) {
            throw new TransportError('not return a json string')
        }
        const ret = JSON.parse(jsonResponse) as JsonRpcResponse
        if (!ret) {
            throw new TransportError('parse ret error')
        }
        if (ret.error) {
            throw new RemoteError(ret.error.message, ret.error.code, ret.error.data)
        }
        if (ret.id === reqId) {
            return ret.result
        } else {
            throw new RemoteError('id not equal', -32600, ret)
        }
    }
    /**
     * send a notify
     * 
     * @param {string} method 
     * @param {...any[]} params 
     * @memberof Client
     */
    notify (method: string, ...params: any[]) {
        this.transport.notify({
            method,
            params,
            jsonrpc: '2.0'
        })
    }
    /**
     * batch call
     * 
     * @memberof Client
     */
    batch () {
        const payloads: JsonRpcMixedBody[] = []
        const client = this
        return {
            invoke: function (method: string, ...params: any[]) {
                payloads.push({
                    id: client.id++,
                    method,
                    params,
                    jsonrpc: '2.0'
                })
                return this
            },
            notify: function (method: string, ...params: any[]) {
                payloads.push({
                    method,
                    params,
                    jsonrpc: '2.0'
                })
                return this
            },
            execute: async function () {
                const res = await client.transport.invoke(payloads)
                if (!res) {
                    return []
                } else {
                    return JSON.parse(res)
                }
            }
        }
    }

    as<T> (namespace?: string) {
        const proxyOjbect = {
            inspect: false,
            toJSON () { return {} },
        } as any
        return new Proxy(proxyOjbect, {
            get: (target: any, prop: string | number | symbol) => {
                if (typeof prop !== 'string') {
                    return target[prop]
                }
                if (typeof target[prop] !== 'undefined') {
                    return target[prop]
                }
                const method = namespace ? namespace + '.' + prop : prop
                return (...args: any[]) => {
                    return this.invoke(method, ...args)
                }
            }
        }) as T
    }
}

