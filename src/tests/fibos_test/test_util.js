var _pubkey = 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
var _prvkey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

var FIBOS = require('../../../dist/fibos.js')
var process = require('process');
var coroutine = require('coroutine');
var path = require('path');

const base32_chars = 'abcdefghijklmnopqrstuvwxyz12345';

function new_name() {
    var name = 'test';
    for (var i = 0; i < 8; i++)
        name += base32_chars.substr(Math.floor(Math.random() * 31), 1);
    return name;
}

exports.new_name = new_name;

exports.user = (fibos, name, pubkey) => {
    name = name || new_name();
    pubkey = pubkey || _pubkey;

    fibos.api.transactSync({
        actions: [{
            account: 'eosio',
            name: 'newaccount',
            authorization: [
                {
                    actor: 'eosio',
                    permission: 'active',
                },
            ],
            data: {
                creator: 'eosio',
                name: name,
                owner: {
                    "threshold": "1",
                    "keys": [
                        {
                            "key": _pubkey,
                            "weight": "1"
                        }
                    ],
                    "accounts": [],
                    "waits": []
                },
                active: {
                    "threshold": "1",
                    "keys": [
                        {
                            "key": _pubkey,
                            "weight": "1"
                        }
                    ],
                    "accounts": [],
                    "waits": []
                }
            },
        }],
    },
        {
            blocksBehind: 2,
            expireSeconds: 30,
        })
    return name;
}

var p;
exports.node = () => {
    if (!p) {
        process.on('beforeExit', exitCode => {
            p.kill(15);
            p.wait();
        });
    } else {
        console.notice("Reset and start the node program, please wait.");
        p.kill(15);
        p.wait();
    }
    p = process.start(process.argv[0], [path.resolve(__dirname, './node.js')]);
    let fibos = FIBOS.Fibos(exports.config);
    while (true) {
        coroutine.sleep(100);
        try {
            let info = fibos.rpc.getInfoSync();
            if (info.head_block_num > 3)
                break;
        } catch (e) { }
    }
}

exports.config = {
    keyProvider: [_prvkey], // WIF string or array of keys..
    httpEndpoint: 'http://127.0.0.1:8870',
    keyPrefix:["FO"],
    logger: {
        log: null,
        error: null
    }
};