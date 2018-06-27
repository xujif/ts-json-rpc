import axios, { AxiosProxyConfig } from 'axios';

import { Client } from '../client';
import { Transport } from '../types';

const pkg = require('../../package.json')

export class HttpTransport implements Transport {
    constructor(protected endpoint: string, protected headers?: any, protected proxy?: AxiosProxyConfig) {
        this.headers = Object.assign({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': `${pkg.name}/${pkg.version}`
        }, this.headers)
    }
    async  invoke (payload: string): Promise<string> {
        const res = await axios.post(this.endpoint, {
            proxy: this.proxy,
            headers: this.headers,
            responseType: 'arraybuffer'
        })
        return res.data.toString() as string
    }
    notify (payload: string): void {
        axios.post(this.endpoint, {
            proxy: this.proxy,
            headers: this.headers,
            responseType: 'arraybuffer'
        }).catch(() => { /**/ })
    }
}
/**
 * create an rpc client over http
 * 
 * @export
 * @param {string} endpoint 
 * @param {*} [headers={}] 
 * @returns 
 */
export function createHttpRpcClient (endpoint: string, headers: any = {}, proxy?: AxiosProxyConfig) {
    return new Client(new HttpTransport(endpoint, headers, proxy))
}
