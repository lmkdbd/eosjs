var test = require('test');
test.setup();

var FIBOS = require('../../../dist/fibos.js')
var test_util = require('./test_util');

describe('trans', () => {
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
                    abi: fibos.api.serializaAbi(abi),
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var js_code = `exports.hi = user => {console.log(user);
            trans.send_inline("${name1}", "hi1", {user:"user1", friend:"user2"}, [{"actor": "${name}", "permission": "active"}]);};
        exports.hi1 = (user, friend) => {console.log(user, friend);trans.send_context_free_inline("${name1}", "hi1", {user:"user1", friend:"user2"});}`;
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
                    permission: "active",
                    parent: 'owner',
                    auth: {
                        threshold: 1,
                        keys: [{
                            key: 'FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
                            weight: 1
                        }],
                        accounts: [{
                            "permission": {
                                "actor": name,
                                "permission": "eosio.code"
                            },
                            "weight": 1
                        }],
                        waits: []
                    }
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        var js_code1 = `exports.hi1 = (user, friend) => console.log(action.has_auth("${name}"), action.has_auth("${name1}"), user, friend)`;
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
    });

    it('send_inline', () => {
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
                    user: 'lion3213'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].console, "lion3213\n");
        assert.equal(r.processed.action_traces[0].inline_traces[0].console, "true false user1 user2\n");
    });

    it('send_context_free_inline', () => {
        var r = fibos.api.transactSync({
            actions: [{
                account: name,
                name: 'hi1',
                authorization: [
                    {
                        actor: name,
                        permission: 'active',
                    },
                ],
                data: {
                    user: 'lion13213',
                    friend: 'lion132131'
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].console, "lion13213 lion132131\n");
        assert.equal(r.processed.action_traces[0].inline_traces[0].console, "false false user1 user2\n");
    });

    it('send_inline without permission', () => {
        var js_code = `
            exports.hi = user => {
                console.log(user);
                trans.send_inline("${name1}", "hi1", {
                    user: "user1",
                    friend: "user2"
                });
            };`;
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
                    user: 'lion3213',
                }
            }],
        },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            })

        assert.equal(r.processed.action_traces[0].inline_traces[0].console, "false false user1 user2\n");
    });

    it('send_context_free_inline with permission', () => {
        var js_code = `
            exports.hi1 = (user, friend) => {
                console.log(user, friend);
                trans.send_context_free_inline("${name1}", "hi1", {
                    user: "user1",
                    friend: "user2"
                }, [{
                    actor: "${name}",
                    permission: "active"
                }]);
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

        assert.throws(() => {
            var r = fibos.api.transactSync({
                actions: [{
                    account: name,
                    name: 'hi1',
                    authorization: [
                        {
                            actor: name,
                            permission: 'active',
                        },
                    ],
                    data: {
                        user: 'lion3213',
                        friend: 'lion132131'
                    }
                }],
            },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                })
        });
    });

    it('call inline action not exposed in abi', () => {
        var js_code = `
            exports.hi = user => {
                console.log(user);
                trans.send_inline("${name1}", "hi2", {
                    user: "user1",
                    friend: "user2"
                }, [{
                    actor: "${name}",
                    permission: "active"
                }]);
            };`;

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

        var js_code1 = `
            exports.hi2 = (user, friend) => {
                console.log(action.has_auth("${name}"), action.has_auth("${name1}"), user, friend)
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

        assert.throws(() => {
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
                        user: 'lion3213',
                    }
                }],
            },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                })
        });
    });
});

require.main === module && test.run(console.DEBUG);