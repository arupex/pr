/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, cb){

    var fs = require('fs');

    try {
        cb(undefined, fs.readFileSync(opts.file));
    }
    catch(e){
        cb(e);
    }
};