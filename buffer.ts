import HttpError from "./HttpError";
import parseHTTPReq from "./parseHTTPReq";
import { IDynamicBuffer, IHttpReq } from "./types";

export function bufferPush(buf: IDynamicBuffer, data: Buffer): void {
    const newLen = buf.length + data.length;
    if (buf.data.length < newLen) {
        // grow the capacity by the power of two
        let cap = Math.max(buf.data.length, 32);
        while (cap < newLen) {
            cap *= 2;
        }
        const grown = Buffer.alloc(cap);
        buf.data.copy(grown, 0, 0);
        buf.data = grown;
    }
    data.copy(buf.data, buf.length, 0);
    buf.length = newLen
}

// remove data from the front
export function bufPop(buf: IDynamicBuffer, len: number): void {
    buf.data.copyWithin(0, len, buf.length);
    buf.length -= len;
}

const kMaxHeaderLen = 1024 * 8;

export function cutMessage(buf: IDynamicBuffer): null | IHttpReq {
    const idx = buf.data.subarray(0, buf.length).indexOf('\r\n\r\n');
    if (idx < 0) {
        if (buf.length > kMaxHeaderLen) {
            throw new HttpError(413, 'Header too long');
        }
        return null;
    }

    // why idx + 4
    // because we need to include the last '\r\n\r\n' in the header
    const msg = parseHTTPReq(buf.data.subarray(0, idx + 4));
    // why 4 here in bufPop?
    // because we need to remove the last '\r\n\r\n' from the buffer
    bufPop(buf, idx + 4);
    return msg;
}