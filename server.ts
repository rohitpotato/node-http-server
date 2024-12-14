import * as net from 'net';
import type { IBodyReader, IDynamicBuffer, IHttpReq, IHttpRes, ITCPConn } from './types';
import { bufferPush, cutMessage } from './buffer';
import HttpError from './HttpError';
import writeHTTPResp from './writeHttpResponse';
import handleReq, { readerFromMemory } from './handleRequest';
import readerFromRequest from './readerFromRequest';

let server = net.createServer({
    pauseOnConnect: true
});
server.on('connection', newConn);
server.listen({ host: '127.0.0.1', port: 1235 });



async function newConn(socket: net.Socket): Promise<void> {
    console.log('new connection', socket.remoteAddress, socket.remotePort);
    const conn: ITCPConn = soInit(socket);
    try {
        await serveClient(conn);
    } catch (exc) {
        console.error('exception:', exc);
        if (exc instanceof HttpError) {
            const resp: IHttpRes = {
                code: exc.code,
                headers: [],
                body: readerFromMemory(Buffer.from(exc.message + '\n')),
            }

            try {
                await writeHTTPResp(conn, resp);
            } catch (exc) { /* ignore */ }


        }
    } finally {
        socket.destroy();
    }
}

// echo server
async function serveClient(conn: ITCPConn): Promise<void> {
    const buf: IDynamicBuffer = {
        data: Buffer.alloc(0),
        length: 0
    }
    while (true) {
        const msg: null | IHttpReq = cutMessage(buf);
        if (!msg) {
            const data = await soRead(conn);
            bufferPush(buf, data);
            if (data.length === 0 && buf.length === 0) {
                return;
            }

            if (data.length === 0) {
                throw new HttpError(400, 'Unexpected EOF')
            }

            continue;
        }

        const requestBody: IBodyReader = readerFromRequest(conn, buf, msg);
        const res: IHttpRes = await handleReq(msg, requestBody);
        await writeHTTPResp(conn, res);

        if (msg.version === '1.0') {
            return;
        }

        while ((await requestBody.read()).length > 0) { }
    }
}


function soInit(socket: net.Socket): ITCPConn {
    const conn: ITCPConn = {
        socket: socket,
        reader: null
    }

    socket.on('data', (data) => {
        console.assert(conn.reader);
        // pause the data event until the next read
        conn.socket.pause();
        conn.reader!.resolve(data);
        conn.reader = null;
    })

    socket.on('end', () => {
        conn.ended = true;
        if (conn.reader) {
            conn.reader.resolve(Buffer.from(''));
            conn.reader = null;
        }
    })

    socket.on('error', (err: Error) => {
        if (conn.reader) {
            conn.reader.reject(err);
            conn.reader = null;
        }
    })

    return conn;
}

export function soRead(conn: ITCPConn): Promise<Buffer> {
    console.assert(!conn.reader);
    return new Promise((resolve, reject) => {

        // if the connection is not readable, complete the promise now.
        if (conn.err) {
            reject(conn.err);
            return;
        }
        if (conn.ended) {
            resolve(Buffer.from(''));   // EOF
            return;
        }

        // save the promise callbacks
        conn.reader = {
            resolve,
            reject
        }
        // and resume the 'data' event to fulfill the promise later.
        conn.socket.resume();
    })
}

export function soWrite(conn: ITCPConn, data: Buffer): Promise<void> {
    console.assert(data.length > 0);
    return new Promise((resolve, reject) => {
        if (conn.err) {
            reject(conn.err);
            return;
        }

        conn.socket.write(data, (err?: Error) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}



