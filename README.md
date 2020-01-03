# pr
Pull Request Generator w/ Plugin support

[![npm version](https://badge.fury.io/js/pull-request-generator.svg)](https://badge.fury.io/js/pull-request-generator) [![dependencies](https://david-dm.org/arupex/pull-request-generator.svg)](http://github.com/arupex/pull-request-generator) ![Build Status](https://api.travis-ci.org/arupex/pull-request-generator.svg?branch=master)
![lifetimeDownloadCount](https://img.shields.io/npm/dt/prme.svg?maxAge=2592000)

#Are you Lazy? So are we!

#Install

    npm install -g prme

#Usage

    prme

#Bam!

#Custom Configuration via pr-conf.json in your cwd


In your pr-conf.json

    {
        "template" : "/myTemplateFile.mustache"

        "plugins": {
            "stackTrace" : {},
            "whatPlugins" : true
        }
    }

    This will output the native plugins installed,
     and the current result of the state machine


 How it all works!

 Native Plugins:

        [
            rally
            jenkins
            jenkinsBuildStatus
            github
            signOffs
            gitBranch
            gitUserRepo
            stackTrace
        ]

These are build right into pull-request-generator


You can build your own! 2 Ways

1. require


    {
        "plugins" : {
            "require" : "myPublishedNPMPlugin"
        }
    }


2. By Path


    {
        "plugins" : {
            "path" : "relative path to cwd of execution"
        }
    }


#How do I write a Plugin?

    module.exports = function(allOpts, state, cb){

    };

**allOpts** is your config file data

**state** is the current state of the state machine
    any modifications will affect later plugins and the mustache templating process

**cb** is your callback for when your done doing your changes