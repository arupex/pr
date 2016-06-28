/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, cb){

    if(!opts || !opts.plugins){
        console.log(!opts, !opts.plugins);
        return cb('no plugins');
    }

    var plugins = [];

    var nativePlugins = {
        rally : require('../core-plugins/rally'),
        jenkins : require('../core-plugins/jenkins'),
        jenkinsBuildStatus : require('../core-plugins/jenkinsBuildStatus'),

        github : require('../core-plugins/github'),
        signOffs : require('../core-plugins/signOffs'),

        gitBranch : require('../core-plugins/gitBranch'),
        gitUserRepo : require('../core-plugins/githubUserRepo'),

        stackTrace : require('../core-plugins/stackTrace')
    };

    if(opts.whatPlugins){
        console.log('native plugins: \n', nativePlugins);
    }

    function loadNativePlugin(name, opts){

        var modul;

        if (typeof opts.require === 'string') {
            modul = require(opts.require);
        }
        else if(typeof opts.path === 'string'){
            modul = require(process.cwd() + opts.require);
        }
        else if(typeof nativePlugins[name] === 'function'){
            modul = nativePlugins[name];
        }
        else {
            console.log('Ignoring', name, 'plugin not found');
        }

        if(modul) {
            plugins.push({
                __module: modul
            });
        }

    }

    Object.keys(opts.plugins).forEach(function loadPlugin(name){
        loadNativePlugin(name, opts.plugins[name])
    });

    cb(undefined, plugins);

};