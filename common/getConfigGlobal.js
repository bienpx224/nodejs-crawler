var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var command = argv._[0];
var config_dev = require('./config_dev.json');
var config_pro = require('./config.json');
var config_global = config_pro;
if (command == 'dev') {
    config_global = config_dev;
}
exports.config_global = config_global;
