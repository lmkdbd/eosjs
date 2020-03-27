var iconv = require('iconv');

export class Encoder implements TextEncoder {
    public encodeInto(source: string, destination: Uint8Array): any {
        throw new Error("Method not implemented.");
    }
    public encoding:string;
    constructor(){
        this.encoding = "utf8";
    }
    public encode(input?: string, options?: TextEncodeOptions): Uint8Array {
        var buf = iconv.encode(this.encoding, input);
        return buf.toArray();
    }
}

export class Decoder implements TextDecoder {
    fatal: boolean;
    ignoreBOM: boolean;
    public encoding:string;
    constructor(){
        this.encoding = "utf8";
    }
    public decode(input?: Uint8Array, options?: TextDecoderOptions): string{
        var buf = new Buffer(input);
        return iconv.decode(this.encoding, buf);
    }
}
