# fibos.js

`fibos.js` 是基于 [eosjs](https://www.npmjs.com/package/eosjs) v20.0.0 开发的，与 `fibos` 链交互的 `npm` 包。 相较于 `eosjs`, `fibos.js` 增加了如下特性：
1. 对国密算法的支持
2. 对 `js` 合约的处理
3. `api` 和 `rpc` 的同步方法

## 安装

### NPM

项目地址为: `https://www.npmjs.com/package/@lmkdbd/fibos.js`

安装方式: `npm i @lmkdbd/fibos.js`

## 使用方式

### 导入模块
```js
var FIBOS = require('@lmkdbd/fibos.js')
```

### 初始化 fibos
```js
var fibos = FIBOS.Fibos( {
    httpEndpoint: "http://localhost:8801",
    keyProvider: ["5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"]
});
```

### 创建账号
```js
var name = "user";
fibos.api.transactSync({
    actions: [{
        account: 'eosio',
        name: 'newaccount',
        authorization: [{
            actor: 'eosio',
            permission: 'active',
        }],
        data: {
            creator: 'eosio',
            name: name,
            owner: {
                threshold: "1",
                keys: [{
                    key: "FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    weight: "1"
                }],
                accounts: [],
                waits: []
            },
            active: {
                threshold: "1",
                keys: [{
                    key: "FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    weight: "1"
                }],
                accounts: [],
                waits: []
            }
         },
    }],
},
{
    blocksBehind: 3,
    expireSeconds: 30,
})
```

### 部署合约
```js
var js_code = `exports.hi = v => console.error(action.name);`;
fibos.api.transactSync({
    actions: [{
        account: "eosio",
        name: 'setcode',
        authorization: [{
            actor: "user",
            permission: 'active',
        }],
        data: {
            account: "user",
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
```

### 部署 ABI 
```js
var abi = {
    "version": "eosio::abi/1.0",
    "structs": [{
        "name": "hi",
        "base": "",
        "fields": [{
            "name": "user",
            "type": "name"
        }]
    }],
    "actions": [{
        "name": "hi",
        "type": "hi",
        "ricardian_contract": ""
    }]
};
fibos.api.transactSync({
    actions: [{
        account: 'eosio',
        name: 'setabi',
        authorization: [{
            actor: "user",
            permission: 'active',
        }],
        data: {
            account: "user",
            abi: fibos.api.serializaAbi(abi),
        }
    }],
},{
    blocksBehind: 3,
    expireSeconds: 30,
})
```

### 调用方法
```js
var r = fibos.api.transactSync({
    actions: [{
        account: "user",
        name: 'hi',
        authorization: [{
            actor: "user",
            permission: 'active',
        }],
        data: {
            user: 'testuser'
        }
    }],
},
{
    blocksBehind: 3,
    expireSeconds: 30,
})
```
### 查询 ABI
```js
var res = fibos.rpc.getAbiSync(`user`)
console.warn('---- res ----',res);
```

## Contributing

[Contributing Guide](./CONTRIBUTING.md)

[Code of Conduct](./CONTRIBUTING.md#conduct)

## License

[MIT](./LICENSE)

## Important

See LICENSE for copyright and license terms.  Block.one makes its contribution on a voluntary basis as a member of the EOSIO community and is not responsible for ensuring the overall performance of the software or any related applications.  We make no representation, warranty, guarantee or undertaking in respect of the software or any related documentation, whether expressed or implied, including but not limited to the warranties or merchantability, fitness for a particular purpose and noninfringement. In no event shall we be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or documentation or the use or other dealings in the software or documentation.  Any test results or performance figures are indicative and will not reflect performance under all conditions.  Any reference to any third party or third-party product, service or other resource is not an endorsement or recommendation by Block.one.  We are not responsible, and disclaim any and all responsibility and liability, for your use of or reliance on any of these resources. Third-party resources may be updated, changed or terminated at any time, so the information here may be out of date or inaccurate.
