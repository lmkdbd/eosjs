/**
 * @module API
 */
// copyright defined in eosjs/LICENSE.txt

import { AbiProvider, AuthorityProvider, BinaryAbi, CachedAbi, SignatureProvider } from './eosjs-api-interfaces';
import { JsonRpc } from './eosjs-jsonrpc';
import { Abi, GetInfoResult, PushTransactionArgs } from './eosjs-rpc-interfaces';
import * as ser from './eosjs-serialize';
import * as util from 'util';
import * as fs from 'fs';
import * as io from 'io';
import * as path from 'path';
import * as zip from 'zip';
import { CLIENT_RENEG_WINDOW } from 'tls';

const abiAbi = require('../src/abi.abi.json');
const transactionAbi = require('../src/transaction.abi.json');

export class Api {
    /** Issues RPC calls */
    public rpc: JsonRpc;

    /** Get subset of `availableKeys` needed to meet authorities in a `transaction` */
    public authorityProvider: AuthorityProvider;

    /** Supplies ABIs in raw form (binary) */
    public abiProvider: AbiProvider;

    /** Signs transactions */
    public signatureProvider: SignatureProvider;

    /** Identifies chain */
    public chainId: string;

    public textEncoder: TextEncoder;
    public textDecoder: TextDecoder;

    /** Converts abi files between binary and structured form (`abi.abi.json`) */
    public abiTypes: Map<string, ser.Type>;

    /** Converts transactions between binary and structured form (`transaction.abi.json`) */
    public transactionTypes: Map<string, ser.Type>;

    /** Holds information needed to serialize contract actions */
    public contracts = new Map<string, ser.Contract>();

    public contractFunctions = new Map<string, Object>();

    /** Fetched abis */
    public cachedAbis = new Map<string, CachedAbi>();

    /**
     * @param args
     *    * `rpc`: Issues RPC calls
     *    * `authorityProvider`: Get public keys needed to meet authorities in a transaction
     *    * `abiProvider`: Supplies ABIs in raw form (binary)
     *    * `signatureProvider`: Signs transactions
     *    * `chainId`: Identifies chain
     *    * `textEncoder`: `TextEncoder` instance to use. Pass in `null` if running in a browser
     *    * `textDecoder`: `TextDecoder` instance to use. Pass in `null` if running in a browser
     */
    constructor(args: {
        rpc: JsonRpc,
        authorityProvider?: AuthorityProvider,
        abiProvider?: AbiProvider,
        signatureProvider: SignatureProvider,
        chainId?: string,
        textEncoder?: TextEncoder,
        textDecoder?: TextDecoder,
    }) {
        this.rpc = args.rpc;
        this.authorityProvider = args.authorityProvider || args.rpc;
        this.abiProvider = args.abiProvider || args.rpc;
        this.signatureProvider = args.signatureProvider;
        this.chainId = args.chainId;
        this.textEncoder = args.textEncoder;
        this.textDecoder = args.textDecoder;

        this.abiTypes = ser.getTypesFromAbi(ser.createInitialTypes(), abiAbi);
        this.transactionTypes = ser.getTypesFromAbi(ser.createInitialTypes(), transactionAbi);
    }

    /** Decodes an abi as Uint8Array into json. */
    public rawAbiToJson(rawAbi: Uint8Array): Abi {
        const buffer = new ser.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
            array: rawAbi,
        });
        if (!ser.supportedAbiVersion(buffer.getString())) {
            throw new Error('Unsupported abi version');
        }
        buffer.restartRead();
        return this.abiTypes.get('abi_def').deserialize(buffer);
    }

    /** Get abi in both binary and structured forms. Fetch when needed. */
    public async getCachedAbi(accountName: string, reload = false): Promise<CachedAbi> {
        if (!reload && this.cachedAbis.get(accountName)) {
            return this.cachedAbis.get(accountName);
        }
        let cachedAbi: CachedAbi;
        try {
            const rawAbi = (await this.abiProvider.getRawAbi(accountName)).abi;
            const abi = this.rawAbiToJson(rawAbi);
            cachedAbi = { rawAbi, abi };
        } catch (e) {
            e.message = `fetching abi for ${accountName}: ${e.message}`;
            throw e;
        }
        if (!cachedAbi) {
            throw new Error(`Missing abi for ${accountName}`);
        }
        this.cachedAbis.set(accountName, cachedAbi);
        return cachedAbi;
    }

    public getCachedAbiSync(accountName: string, reload = false): CachedAbi {
        return util.sync(()=>this.getCachedAbi(accountName, reload), true)();
    }

    /** Get abi in structured form. Fetch when needed. */
    public async getAbi(accountName: string, reload = false): Promise<Abi> {
        return (await this.getCachedAbi(accountName, reload)).abi;
    }

    public getAbiSync(accountName: string, reload = false): Abi {
        return util.sync(()=>this.getAbi(accountName, reload), true)();
    }

    /** Get abis needed by a transaction */
    public async getTransactionAbis(transaction: any, reload = false): Promise<BinaryAbi[]> {
        const accounts: string[] = transaction.actions.map((action: ser.Action): string => action.account);
        const uniqueAccounts: Set<string> = new Set(accounts);
        const actionPromises: Array<Promise<BinaryAbi>> = [...uniqueAccounts].map(
            async (account: string): Promise<BinaryAbi> => ({
                accountName: account, abi: (await this.getCachedAbi(account, reload)).rawAbi,
            }));
        return Promise.all(actionPromises);
    }

    public getTransactionAbisSync(accountName: string, reload = false): Abi {
        return util.sync(()=>this.getTransactionAbis(accountName, reload), true)();
    }

    /** Get data needed to serialize actions in a contract */
    public async getContract(accountName: string, reload = false): Promise<ser.Contract> {
        if (!reload && this.contracts.get(accountName)) {
            return this.contracts.get(accountName);
        }
        const abi = await this.getAbi(accountName, reload);
        const types = ser.getTypesFromAbi(ser.createInitialTypes(), abi);
        const actions = new Map<string, ser.Type>();
        for (const { name, type } of abi.actions) {
            actions.set(name, ser.getType(types, type));
        }
        const result = { types, actions };
        this.contracts.set(accountName, result);
        return result;
    }

    public getContractSync(accountName: string, reload = false): ser.Contract {
        return util.sync(()=>this.getContract(accountName, reload), true)();
    }

    /** Convert `value` to binary form. `type` must be a built-in abi type or in `transaction.abi.json`. */
    public serialize(buffer: ser.SerialBuffer, type: string, value: any): void {
        this.transactionTypes.get(type).serialize(buffer, value);
    }

    /** Convert data in `buffer` to structured form. `type` must be a built-in abi type or in `transaction.abi.json`. */
    public deserialize(buffer: ser.SerialBuffer, type: string): any {
        return this.transactionTypes.get(type).deserialize(buffer);
    }

    /** Convert a transaction to binary */
    public serializeTransaction(transaction: any): Uint8Array {
        const buffer = new ser.SerialBuffer({ textEncoder: this.textEncoder, textDecoder: this.textDecoder });
        this.serialize(buffer, 'transaction', {
            max_net_usage_words: 0,
            max_cpu_usage_ms: 0,
            delay_sec: 0,
            context_free_actions: [],
            actions: [],
            transaction_extensions: [],
            ...transaction,
        });
        return buffer.asUint8Array();
    }

    /** Convert a transaction from binary. Leaves actions in hex. */
    public deserializeTransaction(transaction: Uint8Array): any {
        const buffer = new ser.SerialBuffer({ textEncoder: this.textEncoder, textDecoder: this.textDecoder });
        buffer.pushArray(transaction);
        return this.deserialize(buffer, 'transaction');
    }

    /** Convert actions to hex */
    public async serializeActions(actions: ser.Action[]): Promise<ser.SerializedAction[]> {
        return await Promise.all(actions.map(async ({ account, name, authorization, data }) => {
            const contract = await this.getContract(account);
            return ser.serializeAction(
                contract, account, name, authorization, data, this.textEncoder, this.textDecoder);
        }));
    }

    public serializeActionsSync(actions: ser.Action[]): ser.SerializedAction[] {
        return util.sync(()=>this.serializeActions(actions), true)();
    }


    /** Convert actions from hex */
    public async deserializeActions(actions: ser.Action[]): Promise<ser.Action[]> {
        return await Promise.all(actions.map(async ({ account, name, authorization, data }) => {
            const contract = await this.getContract(account);
            return ser.deserializeAction(
                contract, account, name, authorization, data, this.textEncoder, this.textDecoder);
        }));
    }

    public deserializeActionsSync(actions: ser.Action[]): ser.Action[] {
        return util.sync(()=>this.deserializeActions(actions), true)();
    }

    /** Convert a transaction from binary. Also deserializes actions. */
    public async deserializeTransactionWithActions(transaction: Uint8Array | string): Promise<any> {
        if (typeof transaction === 'string') {
            transaction = ser.hexToUint8Array(transaction);
        }
        const deserializedTransaction = this.deserializeTransaction(transaction);
        const deserializedActions = await this.deserializeActions(deserializedTransaction.actions);
        return { ...deserializedTransaction, actions: deserializedActions };
    }

    public deserializeTransactionWithActionsSync(transaction: Uint8Array | string): any {
        return util.sync(()=>this.deserializeTransactionWithActions(transaction), true)();
    }

    /**
     * Create and optionally broadcast a transaction.
     *
     * Named Parameters:
     *    * `broadcast`: broadcast this transaction?
     *    * `sign`: sign this transaction?
     *    * If both `blocksBehind` and `expireSeconds` are present,
     *      then fetch the block which is `blocksBehind` behind head block,
     *      use it as a reference for TAPoS, and expire the transaction `expireSeconds` after that block's time.
     * @returns node response if `broadcast`, `{signatures, serializedTransaction}` if `!broadcast`
     */
    public async transact(transaction: any, { broadcast = true, sign = true, blocksBehind, expireSeconds }:
        { broadcast?: boolean; sign?: boolean; blocksBehind?: number; expireSeconds?: number; } = {}): Promise<any> {
        let info: GetInfoResult;

        if (!this.chainId) {
            info = await this.rpc.get_info();
            this.chainId = info.chain_id;
        }

        if (typeof blocksBehind === 'number' && expireSeconds) { // use config fields to generate TAPOS if they exist
            if (!info) {
                info = await this.rpc.get_info();
            }
            const refBlock = await this.rpc.get_block(info.head_block_num - blocksBehind);
            transaction = { ...ser.transactionHeader(refBlock, expireSeconds), ...transaction };
        }

        if (!this.hasRequiredTaposFields(transaction)) {
            throw new Error('Required configuration or TAPOS fields are not present');
        }

        const abis: BinaryAbi[] = await this.getTransactionAbis(transaction);
        transaction = { ...transaction, actions: await this.serializeActions(transaction.actions) };
        const serializedTransaction = this.serializeTransaction(transaction);
        let pushTransactionArgs: PushTransactionArgs  = { serializedTransaction, signatures: [] };

        if (sign) {
            const availableKeys = await this.signatureProvider.getAvailableKeys();
            const requiredKeys = await this.authorityProvider.getRequiredKeys({ transaction, availableKeys });
            pushTransactionArgs = await this.signatureProvider.sign({
                chainId: this.chainId,
                requiredKeys,
                serializedTransaction,
                abis,
            });
        }
        if (broadcast) {
            return this.pushSignedTransaction(pushTransactionArgs);
        }
        return pushTransactionArgs;
    }

    public transactSync(transaction: any, { broadcast = true, sign = true, blocksBehind, expireSeconds }:
        { broadcast?: boolean; sign?: boolean; blocksBehind?: number; expireSeconds?: number; } = {}): any {
        return util.sync(()=>this.transact(transaction,{broadcast,sign,blocksBehind,expireSeconds}), true)();
    }

    /** Broadcast a signed transaction */
    public async pushSignedTransaction({ signatures, serializedTransaction }: PushTransactionArgs): Promise<any> {
        return this.rpc.push_transaction({
            signatures,
            serializedTransaction,
        });
    }

    public  pushSignedTransactionSync({ signatures, serializedTransaction }: PushTransactionArgs): any {
        return util.sync(()=>this.pushSignedTransaction({signatures, serializedTransaction}), true)();
    }

    public serializaAbi(abi : any): string {
        const buffer = new ser.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
          })
        
          const abiDefinition = this.abiTypes.get(`abi_def`)
          // need to make sure abi has every field in abiDefinition.fields
          // otherwise serialize throws
          abi = abiDefinition.fields.reduce(
            (acc, { name: fieldName }) =>
              Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
            abi
          )
          abiDefinition.serialize(buffer, abi)
          return Buffer.from(buffer.asUint8Array()).toString(`hex`);
    }

    public compileModule (fname: string){
        var stm = new io.MemoryStream();
        var zf = zip.open(stm, "w");
    
        function append(fname: string, base:string) {
            var files = fs.readdir(fname);
    
            files.forEach((file:string) => {
                var fpath = path.join(fname, file);
                if (fs.stat(fpath).isDirectory())
                    append(fpath, path.join(base, file));
                else
                    zf.write(fs.readFile(fpath), path.join(base, file));
            });
        }
    
        append(fname, "");
    
        zf.close();
        stm.rewind();
    
        return stm.readAll();
    };
    
    public compileCode(code: string) {
        var stm = new io.MemoryStream();
        var zf = zip.open(stm, "w");
        zf.write(new Buffer(code), 'index.js');
        zf.close();
        stm.rewind();
        return stm.readAll();
    };

    // eventually break out into TransactionValidator class
    private hasRequiredTaposFields({ expiration, ref_block_num, ref_block_prefix, ...transaction }: any): boolean {
        return !!(expiration && ref_block_num && ref_block_prefix);
    }

} // Api
