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

    const git = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
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
            state.branch = data.trim();
            state.saneBranch = state.branch;
            if(opts.plugins.gitBranch.branchSanitizer){
                Object.keys(opts.plugins.gitBranch.branchSanitizer).forEach(function(whatItIs){
                    while(state.saneBranch.includes(whatItIs)) {
                        state.saneBranch = state.saneBranch.replace(whatItIs, opts.plugins.gitBranch.branchSanitizer[whatItIs]);
                    }
                });
            }
            cb(err, data);
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
