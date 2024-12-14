## HTTP server using node (net)

A basic http server built using node primitives.

Run `npx ts-node server.ts` to start the node server and create a new TCP connection.

Run `curl -s --data-binary 'hello' http://127.0.0.1:1235/echo` to test.

#### Whats' next?

1. Support `Transfer-encoding: chunked`.
2. Support `File Transfers (IO)`
3. HTTP Caching
4. Compression and stream API
5. Websockets?
