/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(allOpts, state, cb){

    var opts = allOpts.plugins.jenkins;

    var jenkins = require('jenkins');

    var client = jenkins({
        baseUrl : opts.url
    });

    var Mustache = require('mustache');

    var jenkinsJob = opts.jobMustache?Mustache.render(opts.jobMustache, state):opts.saneBranch;

    console.log('', jenkinsJob);

    client.job.get({
       name : jenkinsJob
    }, function(err, job){
        if(!err){
            state.jenkinsUrl = job.url;
        }
        else {
            console.log('jenkins error', err);
        }
        cb();
    });

};