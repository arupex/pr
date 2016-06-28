/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var request = require('request');

    var githubOpts = opts.plugins.github;

    var githubClientOpts = {
        protocol: githubOpts.protocol || 'https',
        host: githubOpts.host || 'api.github.com',
        timeout: githubOpts.timeout || 5000,
        pathPrefix: githubOpts.pathPrefix,
        followRedirects : githubOpts.followRedirects,
        headers : githubOpts.headers
    };

var fullAddress = githubClientOpts.protocol + '://' + githubClientOpts.host + (githubClientOpts.pathPrefix?githubClientOpts.pathPrefix:'') + '/repos/' + state.user + '/' + state.repo + '/commits?per_page=200';
    request.get({

        url : fullAddress,
        json : true
    }, function(err, response){
        var data = response.body;

        if(!err){
            state.commits = [];
            state.commitsUsers = [];
            state.uniqueUsers = [];
            var uniqueUsers = {};

            if(data && Array.isArray(data)) {
                data.forEach(function anaylzeCommit(commit) {
                    if (commit) {
                        if (commit.commit) {
                            state.commits.push(commit.commit.message);
                        }
                        if (commit.author) {
                            //state.commitsUsers.push(commit.author.login);

                            uniqueUsers[commit.author.login] = true;
                        }
                    }
                });
                Object.keys(uniqueUsers).forEach(function(userName){
                   state.uniqueUsers.push(userName);
                });
            }
            else{

                console.log('github data is not array', data);
            }
        }
        else {
            console.log('github err:', err);
        }

        cb();
    });

};