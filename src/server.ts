import { JsonRpcMixedBody, JsonRpcNotify, JsonRpcRequest, JsonRpcResponse, ParseError, RemoteError } from './types';

export class ServerProxy {

    protected exceptionHandle?: (body: any, e: any) => JsonRpcResponse | void
    protected instance: any

    constructor(instance: any) {
        this.instance = instance
    }

    on (event: 'exception', handle: (body: any, e: any) => JsonRpcResponse | void): void {
        this.exceptionHandle = handle
    }

    handle (payload: JsonRpcRequest): Promise<JsonRpcResponse>
    handle (payload: JsonRpcNotify): Promise<undefined>
    handle (payload: JsonRpcMixedBody[]): Promise<JsonRpcResponse[] | undefined>
    handle (payload: string): Promise<JsonRpcResponse[] | JsonRpcResponse | undefined>

    async handle (payload: JsonRpcRequest | JsonRpcNotify | JsonRpcMixedBody[] | string) {
        if (typeof payload === 'string') {
            payload = JSON.parse(payload) as (JsonRpcRequest | JsonRpcNotify | JsonRpcMixedBody[])
        }
        if (Array.isArray(payload)) {
            return this.handleBatch(payload)
        }
        try {
            if (!payload) {
                throw new ParseError('parse error: json parse error', -32700)
            }
            if (payload.jsonrpc !== '2.0') {
                throw new ParseError('parse error: jsonrpc not equal 2.0', -32700)
            }
            if (!payload.method) {
                throw new ParseError('Invalid Request', -32600)
            }
            if (typeof this.instance[payload.method] !== 'function') {
                throw new ParseError('no method', -32601)
            }
        } catch (e) {
            return this.parseError(e)
        }
        try {
            const params = payload.params || []
            let ret: any
            if (Array.isArray(params)) {
                ret = await this.instance[payload.method](...params)
            } else {
                ret = await this.instance[payload.method](params)
            }
            if ((payload as JsonRpcRequest).id !== void 0) {
                return {
                    'id': (payload as JsonRpcRequest).id,
                    'jsonrpc': "2.0",
                    'result': ret
                }
            }
        } catch (e) {
            // if payload is a notify ignore the error
            if (payload.id) {
                if (this.exceptionHandle) {
                    return this.exceptionHandle(payload, e) || this.makeError(payload.id, e)
                } else {
                    return this.makeError(payload.id, e)
                }
            } else if (this.exceptionHandle) {
                this.exceptionHandle(payload, e)
            }
        }
    }

    async handleBatch (payloads: JsonRpcMixedBody[]): Promise<JsonRpcResponse[] | undefined> {
        const promises = payloads.map(p => this.handle(p as JsonRpcRequest))
        const arr = await Promise.all(promises)
        const vaildResults = arr.filter(r => !!r)
        //  the server MUST NOT return an empty Array and should return nothing at all.
        return vaildResults.length > 0 ? vaildResults : undefined
    }

    protected parseError (e: ParseError) {
        return {
            'id': null,
            'jsonrpc': "2.0",
            'error': {
                'code': e.code || -32700,
                'message': e.message || 'parse error'
            }
        }
    }

    protected makeError (id: null | number | string | undefined, e: any): JsonRpcResponse {
        return {
            'id': id,
            'jsonrpc': "2.0",
            'error': {
                'code': e instanceof RemoteError ? e.code : -32603,
                'message': e instanceof RemoteError ? e.message : 'internal error'
            }
        }
    }


}
/**
 * RpcServer
 * 
 * @export
 * @class Server
 * @extends {EventEmitter}
 * @implements {RpcServer}
 */
export class Server extends ServerProxy {
    constructor() {
        super({})
    }

    /**
     * 暴露一个方法
     * 
     * @param {string} method 
     * @param {Function} func 
     * @memberof Server
     */
    expose (method: string, func: Function) {
        this.instance[method] = func
    }
}