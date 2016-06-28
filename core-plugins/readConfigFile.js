/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, cb){

    var fs = require('fs');

    try {
        process.nextTick(function(){
            try {
                var readFileSync = fs.readFileSync(opts.file, 'utf8');
                cb(undefined, JSON.parse(readFileSync));
            }
            catch(e){
                cb(e);
            }
        });
    }
    catch(e){
        cb(e);
    }
};