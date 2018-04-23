
### Client with http Trasport
```typescript
import { createHttpRpcClient } from 'json-rpc2.0-node'
const client = createHttpRpcClient('http://endpoint',{Authorization:"token or other headers, or other http header"})
const res = await client.invoke('method','param1','param2')
client.notify('method','param1','param2')

// or cast to an interface
const t:T = client.as<T>()
t.method('param1','param2')

```


### Client with custom Trasport
```typescript
// implement the transport interface
// export interface Transport {
//     (payload: string): Promise<string | undefined>
// }

import { Client,Trasport } from 'json-rpc2.0-node'

function Mytransport(json:string){
    return Promise.resolve(/*json respose*/)
}

const client = new Client(Mytransport)

```



### Server 
```typescript
import { Server } from 'json-rpc2.0-node'
const server = new Server()
server.expose('hello', () => 'hello world!')
const jsonbody = `
{
	"id":10,
	"method":"hello",
	"jsonrpc":"2.0"
}
`
const jsonrpcResponse = await server.handle(jsonbody)
// send your response back to client 

```

see more help in src/tests