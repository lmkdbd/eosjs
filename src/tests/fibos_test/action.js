var test = require('test');
test.setup();

var FIBOS = require('../../../dist/fibos.js')
var test_util = require('./test_util');

describe('action', () => {
    var name;
    var name1;
    var fibos;
    var abi = {
        "version": "eosio::abi/1.0",
        "structs": [{
            "name": "player",
            "base": "",
            "fields": [{
                "name": "title",
                "type": "string"
            }, {
                "name": "age",
                "type": "int64"
            }]
        }, {
            "name": "hi",
            "base": "",
            "fields": [{
                "name": "user",
                "type": "name"
            }]
        }, {
            "name": "hi1",
            "base": "",
            "fields": [{
                "name": "user",
                "type": "name"
            }, {
                "name": "friend",
                "type": "name"
            }]
        }],
        "actions": [{
            "name": "hi",
            "type": "hi",
            "ricardian_contract": ""
        }, {
            "name": "hi1",
            "type": "hi1",
            "ricardian_contract": ""
        }]
    };
    var abi1 = {
        "version": "eosio::abi/1.0",
        "structs": [],
        "actions": []
    };

    before(() => {
        require.main === module && test_util.node();

        fibos = FIBOS.Fibos(test_util.config);

        name = test_util.user(fibos);
        name1 = test_util.user(fibos);
        fibos.api.transactSync({
            actions: [{
                account: 'eosio',
                name: 'setabi',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    abi: fibos.api.serializaAbi(abi),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        fibos.api.transactSync({
            actions: [{
                account: 'eosio',
                name: 'setabi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name1,
                    abi: fibos.api.serializaAbi(abi1),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
    });



    it('name', () => {
        var js_code = `exports.hi = v => console.error(action.name);`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion12'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, 'hi\n');
    });

    it('account', () => {
        var js_code = `exports.hi = v => console.error(action.account);`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion12'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, name + "\n");
    });

    it('is_account', () => {
        var js_code = `exports.hi = v => console.error(action.is_account(action.account), action.is_account("notexists"));`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion123'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, "true false\n");
    });

    it('receiver', () => {
        var js_code = `exports.hi = v => console.error(action.receiver);`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion14'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, name + "\n");
    });

    it('has_auth', () => {
        var js_code = `exports.hi = v => console.error(action.has_auth(action.receiver));`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion2'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, 'false\n');

        var js_code = `exports.hi = v => console.error(action.has_auth("${name1}"));`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion1'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, 'true\n');
    });

    it('require_auth', () => {
        var js_code = `exports.hi = v => console.error(action.require_auth(action.receiver));`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion4'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })


        assert.throws(() => {
            var r = fibos.api.transactSync({
                actions: [{
                    account: name,
                    name: 'hi',
                    authorization: [
                        {
                            actor: name1,
                            permission: 'active',
                        },
                    ],
                    data: {
                        user: 'lion3'
                    }
                }],
            },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                })
        })
    });

    it('require_auth with permission', () => {
        var js_code = `exports.hi = v =>console.error(action.require_auth(action.receiver, "hello"));`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'updateauth',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    permission: 'hello',
                    parent: 'active',
                    auth: {
                        threshold: 1,
                        keys: [{
                            key: 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
                            weight: 1
                        }],
                        "accounts": [],
                        "waits": []
                    }
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'linkauth',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    code: name,
                    type: "hi",
                    requirement: "hello"
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'hello',
                    },
                ],
                data: {
                    user: 'lion4'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.throws(() => {
            r = fibos.api.transactSync({
                actions: [{
                    account: name,
                    name: 'hi',
                    authorization: [
                        {
                            actor: name,
                            permission: 'active',
                        },
                    ],
                    data: {
                        user: 'lion3'
                    }
                }],
            },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                })
        })

    });

    it("recipient", () => {
        var js_code = `exports.hi = v => {
                console.error(action.has_recipient(action.receiver), action.has_recipient("${name1}"));
                action.require_recipient("${name1}")
                console.error(action.has_recipient(action.receiver), action.has_recipient("${name1}"));
            }`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var js_code1 = `exports.on_hi = v => {
            console.log(action.receiver, action.account , v);
        };
        exports.hi = v => {
            throw new Error();
        }`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name1,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name1,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code1).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'hello',
                    },
                ],
                data: {
                    user: 'lion412'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].console, "true false\ntrue true\n");
        assert.equal(r.processed.action_traces[0].inline_traces[0].console, `${name1} ${name} lion412\n`);
    });

    it("authorization", () => {
        var js_code = `exports.hi = v => {console.error(action.authorization);}`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion413'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].console, `[\n  {\n    \"actor\": \"${name}\",\n    \"permission\": \"active\"\n  }\n]\n`);
    });

    it('publication_time', () => {
        var js_code = `exports.hi = v => {
            console.log(Date.now()* 1000 - action.publication_time);
        }`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion2'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })
        assert.equal(r.processed.action_traces[0].console, '0\n');
    });

    it('id', () => {
        var js_code = `exports.hi = v => {
            console.log(action.id);
        }`;
        fibos.api.transactSync({
            actions: [{
                account: "eosio",
                name: 'setcode',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    account: name,
                    vmtype: 0,
                    vmversion: 0,
                    code: fibos.api.compileCode(js_code).toString(`hex`),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].console.trim(), r.transaction_id);
    });
});

require.main === module && test.run(console.DEBUG);