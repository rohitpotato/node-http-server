import { Http2ServerResponse } from "http2";
import { soWrite } from "./server";
import { IHttpReq, IHttpRes, ITCPConn } from "./types";
import { fieldGet } from "./readerFromRequest";

/**
 * 
 * The encodeHTTPResp() function encodes a response header into a byte buffer. The message
format is almost identical to the request message, except for the first line
 */

function encodeHTTPResp(resp: IHttpRes): Buffer {
    // the first line of the response message
    const statusLine = `HTTP/1.1 ${resp.code} ${'OK'}\r\n`;
    // the headers
    const headers = resp.headers.reduce((acc, h) => acc + h.toString() + '\r\n', '');
    // the empty line
    const emptyLine = '\r\n';
    return Buffer.from(statusLine + headers + emptyLine);
}

// send an HTTP response through the socket
async function writeHTTPResp(conn: ITCPConn, resp: IHttpRes): Promise<void> {
    if (resp.body.length < 0) {
        throw new Error('TODO: chunked encoding');
    }
    // set the "Content-Length" field
    console.assert(!fieldGet(resp.headers, 'Content-Length'));
    resp.headers.push(Buffer.from(`Content-Length: ${resp.body.length}`));
    // write the header
    await soWrite(conn, encodeHTTPResp(resp));
    // write the body
    while (true) {
        const data = await resp.body.read();
        if (data.length === 0) {
            break;
        }
        await soWrite(conn, data);
    }
}

export default writeHTTPResp