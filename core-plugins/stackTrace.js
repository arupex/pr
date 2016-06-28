/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, stack, cb){

    console.log('stack', JSON.stringify(stack, null, 3));

    cb();

};