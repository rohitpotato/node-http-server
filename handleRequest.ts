import { IBodyReader, IHttpReq, IHttpRes } from "./types";

async function handleReq(req: IHttpReq, body: IBodyReader): Promise<IHttpRes> {
    // act on the request URI
    let resp: IBodyReader;
    switch (req.uri.toString('latin1')) {
        case '/echo':
            // http echo server
            resp = body;
            break;
        default:
            resp = readerFromMemory(Buffer.from('hello world.\n'));
            break;
    }
    return {
        code: 200,
        headers: [Buffer.from('Server: my_first_http_server')],
        body: resp,
    };
}

// BodyReader from in-memory data
export function readerFromMemory(data: Buffer): IBodyReader {
    let done = false;
    return {
        length: data.length,
        read: async (): Promise<Buffer> => {
            if (done) {
                return Buffer.from(''); // no more data
            } else {
                done = true;
                return data;
            }
        },
    };
}

export default handleReq;