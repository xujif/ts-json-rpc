## json rpc lib 

### Client with http Trasport
```typescript
import { createHttpRpcClient } from 'json-rpc2.0-node'
const client = createHttpRpcClient('http://endpoint',{Authorization:"token or other headers"})
const res = await client.invoke('method','param1','param2')
client.notify('method','param1','param2')
// or cast to an interface
// const t:T = client.as<T>()
// t.xxx()

```


### Client with self Trasport
```typescript
import { Client,Trasport } from 'json-rpc2.0-node'
class MyTransport implements Trasport{
    invoke (body: JsonRpcRequest): Promise<JsonRpcResponse> {
        // send body
    }

    notify (body: JsonRpcNotify): void {
       // send body
    }
}
const transport = new MyTransport()
const client = new Client(transport)

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