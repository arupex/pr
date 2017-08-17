/**
 * Created by daniel.irwin on 6/28/16.
 */
module.exports = function(opts, state, cb){

    var mapAttack = require('map-attack');

    var mapDiff = require('diff-map');

    var request = require('request');

    var githubOpts = opts.plugins.github; //reuse github opts

    var githubClientOpts = {
        protocol: githubOpts.protocol || 'https',
        host: githubOpts.host || 'api.github.com',
        timeout: githubOpts.timeout || 5000,
        pathPrefix: githubOpts.pathPrefix,
        followRedirects : githubOpts.followRedirects,
        headers : githubOpts.headers
    };

    function calcAddress(protocol, host, pathPrefix, user, repo, pageSize, sha){
        var host = protocol + '://' + host + (pathPrefix ? pathPrefix : '');
        var endpoint = '/repos/' + user + '/' + repo + '/commits';
        return host + endpoint + ('?per_page='+ (pageSize?pageSize:200)) + (sha?('&sha=' + encodeURIComponent(sha)):'');
    }

    var fullAddress = calcAddress(githubClientOpts.protocol, githubClientOpts.host, githubClientOpts.pathPrefix, state.user, state.repo);
    var masterBranch;
    if(githubOpts.masterUser && githubOpts.masterRepo){
        masterBranch = calcAddress(githubClientOpts.protocol, githubClientOpts.host, githubClientOpts.pathPrefix, githubOpts.masterUser, githubOpts.masterRepo, 200, githubOpts.master);
    }


    else {
        masterBranch = fullAddress + '&sha=' + encodeURIComponent(githubOpts.master);
    }
    var currentBranch = fullAddress + '&sha=' + encodeURIComponent(state.branch);

    //console.log('masterBranch', masterBranch);
    //console.log('currentBranch', currentBranch);

    function diffCommits(master, current){

        var users = {};

        var commits = [];

        //console.log('master', master);
        //console.log('current', current);

        var masterCommits = mapAttack(master, 'sha');

        var earliestSharedCommit = (current.reduce(function(acc, commit){
            if(commit && masterCommits[commit.sha] && (Date.parse(commit.commit.author.date) < acc)){
                return commit;
            }
            return acc;
        }, new Date().getTime()));


        masterCommits = mapAttack(master.filter(function(commit){
            return Date.parse(commit.commit.author.date) < earliestSharedCommit
        }), 'sha');

        var currentCommits = mapAttack(current.filter(function(commit){
            return Date.parse(commit.commit.author.date) < earliestSharedCommit
        }), 'sha');

        var commitsDiffer = mapDiff(currentCommits, masterCommits);

        var differCommitArray = mapAttack(commitsDiffer, 'sha');

        console.log('DIFF', differCommitArray.length);

        differCommitArray.forEach(function(commit){
            if (commit) {
                if (commit.commit) {
                    commits.push(commit.commit.message);
                }
                if (commit.author) {
                    //state.commitsUsers.push(commit.author.login);

                    users[commit.author.login] = true;
                }
            }
        });

        return {
            users : Object.keys(users),
            commits : commits
        };

    }


    console.log('masterBranch', masterBranch);

    console.log('currentBranch', currentBranch);

    request.get({
        url : masterBranch,
        json : true
    }, function(err, masterResp){

        if(!err){
            var masterCommits = masterResp.body;


            request.get({
                url : currentBranch,
                json : true
            }, function(err, currentResp){

                if(!err){

                    var currentCommits = currentResp.body;

                    var commits = diffCommits(masterCommits, currentCommits);
                    state.commits = commits.commits;
                    state.diffUsers = commits.users;

                    cb();

                }
                else {
                    console.log('github err:', err);

                    cb();
                }
            });

        }
        else {
            console.log('github err:', err);

            cb();
        }

    });
};