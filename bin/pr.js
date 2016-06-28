#!/usr/bin/env node

module.exports = (function(){

    var ConfigFileReadPlugin = require('../core-plugins/readConfigFile');

    ConfigFileReadPlugin({
        file : process.cwd() + '/pr-conf.json'
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

            var state = { created : new Date().toDateString() };

            var whenDone = function(state){
                var prBuilder = require('../core-plugins/prBuilder');
                prBuilder(configFile, state, function(){
                    console.log('Done');
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