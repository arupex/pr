
const spwanChildSync = require('child_process').spawnSync;

module.exports = function(opts, state, callback) {

    var github = opts.plugins.github;

    if(github.host && (github.masterUser||state.user) && (github.masterRepo||state.repo) && github.master && state.user && state.branch) {
        var url = `http://${github.host}/${github.masterUser || state.user}/${github.masterRepo || state.repo}/compare/${github.master}...${state.user}:${state.branch}`;
        spwanChildSync('open', [url]);
    }
    else {
        console.log('could not properly create/open prLink is github configured correctly?');
    }
    callback();
};