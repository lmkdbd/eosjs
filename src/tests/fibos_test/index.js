var test = require('test');
var test_util = require('./test_util');
test.setup();

test_util.node();
run('./action');
run('./trans');

test.run(console.DEBUG);