

export interface JsonRpcResponse {
    id: null | number | string
    jsonrpc: '2.0'
    result?: any
    error?: {
        code: number,
        message: string,
        data?: any
    }
}

export interface JsonRpcRequest {
    method: string
    id: number | string
    params?: any[]
    jsonrpc: '2.0'
}

export interface JsonRpcNotify {
    id?: null | undefined
    method: string
    params?: any[]
    jsonrpc: '2.0'
}

export type JsonRpcMixedBody = JsonRpcRequest | JsonRpcNotify

export class RemoteError extends Error {
    constructor(readonly message: string = 'internal error', readonly code: number = -32603, readonly data?: any) {
        super(message)
    }
    toJSON () {
        return {
            name: 'JsonRpc:RemoteError',
            code: this.code,
            message: this.message,
            data: this.data
        }
    }
}

export class ParseError extends Error {
    constructor(readonly message: string = 'parse error', readonly code: number = -32700) {
        super(message)
    }
    toJSON () {
        return {
            name: 'JsonRpc:ParseError',
            code: this.code,
            message: this.message,
        }
    }
}
export class TransportError extends Error {
    constructor(err: any) {
        super(err.message || err)
        if (err.stack) {
            this.stack = err.stack
        }
    }
    toJSON () {
        return {
            name: 'JsonRpc:TransportError',
            code: -32600,
            message: this.message,
        }
    }
}

export interface Transport {
    invoke (payload: JsonRpcRequest | JsonRpcMixedBody[]): Promise<string>
    notify (payload: JsonRpcNotify | JsonRpcNotify[]): void
}
export interface RpcClient {
    invoke (method: string, ...params: any[]): Promise<any>
    notify (method: string, ...params: any[]): void
    as<T> (): T
}

export interface RpcServer {
    on (event: 'exception', handle: (body: any, e: any) => void): void
    handle (payload: JsonRpcRequest | JsonRpcNotify[]): Promise<JsonRpcResponse>
    handle (payload: JsonRpcNotify | JsonRpcNotify[]): Promise<undefined>
    handle (payload: JsonRpcMixedBody[]): Promise<JsonRpcResponse[] | undefined>
    handle (payload: string): Promise<JsonRpcResponse[] | JsonRpcResponse | undefined>
    expose (method: string, func: Function): void
}
