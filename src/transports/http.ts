import axios, { AxiosProxyConfig } from 'axios';

import { Client } from '../client';

const pkg = require('../../package.json')

/**
 * create an rpc client over http
 * 
 * @export
 * @param {string} endpoint 
 * @param {*} [headers={}] 
 * @returns 
 */
export function createHttpRpcClient (endpoint: string, headers: any = {}, proxy?: AxiosProxyConfig) {
    return new Client(async (body: string) => {
        const res = await axios.post(endpoint, body, {
            proxy: proxy,
            headers: Object.assign({
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': `${pkg.name}/${pkg.version}`
            }, headers),
            responseType: 'arraybuffer'
        })
        return res.data.toString() as string
    })
}
