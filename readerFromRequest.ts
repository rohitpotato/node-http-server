import { bufferPush, bufPop } from "./buffer";
import HttpError from "./HttpError";
import { soRead } from "./server";
import { IBodyReader, IDynamicBuffer, IHttpReq, ITCPConn } from "./types";

export const fieldGet = (headers: Buffer[], name: string): Buffer | null => {
    for (const h of headers) {
        if (h.subarray(0, h.length).indexOf(`\r\n\r\n`) < 0) {
            const idx = h.toString().indexOf(':');
            if (idx < 0) {
                return null;
                throw new HttpError(400, 'Bad Request');
            }
            if (h.subarray(0, idx).toString() === name) {
                return h.subarray(idx + 1);
            }
        }
    }
    return null;
}

const readerFromRequest = (
    conn: ITCPConn,
    buf: IDynamicBuffer,
    req: IHttpReq
) => {
    let bodylen = -1;
    const contentLen = fieldGet(req.headers, 'Content-Length');
    if (contentLen) {
        bodylen = parseInt(contentLen.toString('latin1'));
        if (isNaN(bodylen)) {
            throw new HttpError(400, 'bad content-length');
        }
    }
    const bodyAllowed = !(req.method === 'GET' || req.method === 'HEAD');
    const chunked = fieldGet(req.headers, 'Transfer-Encoding')?.equals(Buffer.from('chunked')) || false;
    if (!bodyAllowed && (bodylen > 0) || chunked) {
        throw new HttpError(400, 'body not allowed');
    }

    if (!bodyAllowed) {
        bodylen = 0;
    }

    if (bodylen > 0) {
        return readerFromContentLength(conn, buf, bodylen);
    } else if (chunked) {
        // chunked encoding
        throw new HttpError(501, 'TODO');
    } else {
        // read the rest of the connection
        throw new HttpError(501, 'TODO');
    }
}

const readerFromContentLength = (conn: ITCPConn, buf: IDynamicBuffer, remain: number): IBodyReader => {
    return {
        length: remain,
        read: async (): Promise<Buffer> => {
            if (remain === 0) {
                return Buffer.from(''); // done
            }

            if (buf.length === 0) {
                // try to get some data if there is none
                const data = await soRead(conn);
                bufferPush(buf, data);
                if (data.length === 0) {
                    // expect more data!
                    throw new Error('Unexpected EOF from HTTP body');
                }
            }
            // consume data from the buffer
            const consume = Math.min(buf.length, remain);
            remain -= consume;
            const data = Buffer.from(buf.data.subarray(0, consume));
            bufPop(buf, consume);
            return data;
        }
    }
}


export default readerFromRequest;