/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var GithubApi = require('github');

    var github = new GithubApi({
        protocol : opts.protocol || 'https',
        host : opts.host || 'api.github.com',
        timeout : opts.timeout || 5000,
        pathPrefix: opts.pathPrefix
    });

    github.repos.getCommits({
        per_page : opts.pageSize || 200,
        user : state.user,
        repo : state.repo
    }, function(err, data){

        if(!err){
            state.commits = [];
            state.commitsUsers = [];

            data.forEach(function anaylzeCommit(commit){
                state.commits.push(commit.commit.message);

                state.commitsUsers.push(commit.author.login);
            });
        }

        cb();
    });

};