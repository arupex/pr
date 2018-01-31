/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var proc = require('child_process').spawn('pbcopy');
    proc.stdin.write(state.prBuilderOutput || '');
    proc.stdin.end();

    proc.on('close', function(code) {
        console.log('pbCopy exited ' + code);
        cb();
    });
};