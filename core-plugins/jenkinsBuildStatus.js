/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    if(state.jenkinsUrl){
        state.jenkinsBuildIcon = '[![Build Icon]('+state.jenkinsUrl+'/badge/icon)]('+state.jenkinsUrl+')';
    }
    cb();
};