import net from 'net'

export interface IHttpReq {
    code: number;
    method: string;
    uri: Buffer,
    version: string;
    headers: Buffer[];
    body: IBodyReader
}

export type IHttpRes = {
    code: number;
    headers: Buffer[];
    body: IBodyReader
}

export type IBodyReader = {
    length: number;
    read: () => Promise<Buffer>;
}

export type ITCPConn = {
    socket: net.Socket;
    // from the 'error' event
    err?: null | Error;
    // EOF, from the 'end' event
    ended?: boolean;
    reader: null | {
        resolve: (value: Buffer) => void;
        reject: (error: Error) => void;
    }
}

export type IDynamicBuffer = {
    data: Buffer;
    length: number;
}