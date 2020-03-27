var fibos = require('fibos');
var path = require('path');

fibos.config_dir = path.join(__dirname, "node");
fibos.data_dir = path.join(__dirname, "node");

console.notice("config_dir:", fibos.config_dir);
console.notice("data_dir:", fibos.data_dir);

fibos.load("http", {
    "http-server-address": "0.0.0.0:8870",
    "access-control-allow-origin": "*",
    "http-validate-host": false,
    "verbose-http-errors": true
});

fibos.load("net", {
    "p2p-listen-endpoint": "0.0.0.0:9870"
});

fibos.load("producer", {
    'producer-name': 'eosio',
    'enable-stale-production': true,
    'max-transaction-time': 3000
});

fibos.load("chain", {
    "delete-all-blocks": true,
    "contracts-console": true
});

fibos.load("chain_api");

// fibos.load("emitter");

// fibos.on('transaction', at => {
//     console.log('transaction', at);
// });

// fibos.on('block', blk => {
//     console.warn('block', blk);
// });

// fibos.on('irreversible_block', blk => {
//     console.notice('irreversible_block', blk);
// });

fibos.enableJSContract = true;

fibos.start();