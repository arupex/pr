/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var GithubApi = require('github');

    var githubOpts = opts.plugins.github;

    var github = new GithubApi({
        protocol : githubOpts.protocol || 'https',
        host : githubOpts.host || 'api.github.com',
        timeout : githubOpts.timeout || 5000,
        pathPrefix: githubOpts.pathPrefix
    });

    github.repos.getCommits({
        per_page : githubOpts.pageSize || 200,
        user : state.user,
        repo : state.repo
    }, function(err, data){

        if(!err){
            state.commits = [];
            state.commitsUsers = [];

            data.forEach(function anaylzeCommit(commit){
                if(commit){
                    if(commit.commit) {
                        state.commits.push(commit.commit.message);
                    }
                    if(commit.author) {
                        state.commitsUsers.push(commit.author.login);
                    }
                }
            });
        }

        cb();
    });

};