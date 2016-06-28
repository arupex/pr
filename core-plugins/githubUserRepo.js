/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    function log(label, data){
        if(opts && opts.log){
            console.log(label, data);
        }
    }

    const spawn = require('child_process').spawn;

    const git = spawn('git', ['config', '--get', 'remote.origin.url'], {
        cwd : process.cwd()
    });

    var branch;
    var error;

    git.stdout.on('data', function(data){
        log('data', data.toString());
        branch = data.toString();
    });

    git.stderr.on('data', function(err){
        log('err', err.toString());
        error = err.toString();
    });

    function callback(err, data){
        if(typeof cb === 'function'){

            var gitHubParseRegex = opts.githubRepoUserRegex || /\/(\w+)\/(\w+).git/;
            var regexResult = gitHubParseRegex.exec(data);

            log('user', regexResult[1]);
            log('repo', regexResult[2]);

            state.user = regexResult[1];
            state.repo = regexResult[2];

            cb(err, {
                user : regexResult[1],
                repo : regexResult[2]
            });
        }
        else {
            log('err', err, 'data', data);
        }
    }

    git.on('close', function(code){
        log('closed with code ===', code);
        if(code === 0 || code ){
            callback(undefined, branch);
        }
        else {
            callback({
                code : code,
                err : error
            })
        }
    });

};
