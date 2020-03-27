import { Api } from './eosjs-api';
import { JsonRpc } from './eosjs-jsonrpc';
import { JsSignatureProvider } from './eosjs-jssig';
import { fetch } from './helper/fetch';
import { Encoder, Decoder } from './helper/serialize_helper';
import { changePrefix } from './eosjs-numeric';

export class Fibos {
    constructor(config:any){
    if (config.keyPrefix)
    {
        changePrefix(config.keyPrefix);
    }
    const signatureProvider = new JsSignatureProvider(
        config.keyProvider
    )
    const rpc = new JsonRpc(config.httpEndpoint, { fetch })
    const api = new Api({
        rpc,
        signatureProvider,
        textDecoder: new Decoder(),
        textEncoder: new Encoder(),
    })
    return {
        rpc,
        api
    }
    }
}