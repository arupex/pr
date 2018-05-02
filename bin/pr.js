#!/usr/bin/env node

module.exports = (function(){

    var ConfigFileReadPlugin = require('../core-plugins/readConfigFile');

    var file = process.cwd() + '/pr-conf.json';

    if(process.argv.length > 2){
        file = process.cwd() + '/' + process.argv[2];
    }

    process.on('uncaughtException', function(err){
        console.log('', err);
    });

    ConfigFileReadPlugin({
        file : file
    }, function (err, configFile){
        if(err){
            console.log('configFileRead', err.stack);
            configFile = require('../defaultConfig.json');
        }

        //console.log('', configFile);

        var pluginLoader = require('../core-plugins/pluginLoader');

        pluginLoader(configFile, function(err, plugins){

            if(err){
                console.log('', err);
                return;
            }

            var state = { created : new Date().toDateString().replace(/ /g, '_') };

            var whenDone = function(state){
                var prBuilder = require('../core-plugins/prBuilder');
                prBuilder(configFile, state, function(){
                    if(configFile.plugins.pbCopy){
                        var pbCopy = require('../core-plugins/pbCopy');
                        pbCopy(configFile, state, function () {
                            console.log('Done');
                        });
                    }
                    else {
                        console.log('Done');
                    }
                });
            };

            function nextPlugin(){
                var plug = plugins.shift();
                if(!plug){
                    whenDone(state);
                }
                else if(plug && typeof plug.__module === 'function'){
                    plug.__module(configFile, state, nextPlugin);
                }
            }

            nextPlugin();

        });

    });

})();