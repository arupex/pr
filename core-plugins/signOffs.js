/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){
    if(opts.signOffs){
        state.signOffs = opts.signOffs;
    }
    cb();
};