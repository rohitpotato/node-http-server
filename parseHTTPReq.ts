// implement this
// parseHTTPReq takes a buffer and returns an object with the following properties:
// method: the HTTP method (GET, POST, PUT, DELETE, etc.)

import HttpError from "./HttpError";
import { IHttpReq } from "./types";

const parseRequestLine = (line: Buffer) => {
    console.log('parse request line', line.toString());
    const parts = line.toString().split(' ');
    if (parts.length !== 3) {
        throw new HttpError(400, 'Bad Request');
    }
    const version = parts[0].split('/')[1];
    return [parts[0], parts[1], version];
}

const validateHeader = (header: Buffer) => {
    const idx = header.indexOf(':');
    if (idx < 0) {
        return true;
    }
    return false;
}

const parseHTTPReq = (data: Buffer): IHttpReq => {
    // @ts-ignore
    const lines: Buffer[] = data.toString().split('\r\n');
    const [method, uri, version] = parseRequestLine(lines[0])
    const headers: Buffer[] = [];
    for (let i = 1; i < lines.length; i++) {
        const h = Buffer.from(lines[i]);
        // if (validateHeader(h)) {
        //     throw new HttpError(400, 'Bad Request');
        // }
        headers.push(h);
    }
    console.assert(lines[lines.length - 1].length === 0);
    // @ts-ignore
    return {
        method: method, uri: Buffer.from(uri), version: version, headers: headers,
    };
}

export default parseHTTPReq;