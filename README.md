# pr
Pull Request Generator w/ Plugin support

#Are you Lazy? So are we!

#Install

    npm install -g pull-request-generator

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