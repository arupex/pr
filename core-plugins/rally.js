/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var userStoryRegex = /(us[0-9]+)/i;
    var defectRegex = /(de[0-9]+)/;

    var rally = require('rally');

    var Q = require('q');

    //console.log('', opts.plugins.rally);
    var restApi = rally(opts.plugins.rally);
    var queryUtils = rally.util.query;

    function getTaskUnit(formattedId){
        //console.log('getting ', formattedId, ' from rally');
        return restApi.query({
            type: formattedId.toUpperCase().indexOf('US') > -1?'hierarchicalrequirement':'defect',
            start: 1,
            pageSize: 2,
            limit: 10,
            order: 'Rank',
            fetch: ['FormattedID', 'Name', 'ScheduleState', 'Tasks'],
            query: queryUtils.where('FormattedID', '=', formattedId)
        });
    }


    function getTasks(taskId){
        //console.log('getting ', taskId, ' from rally');
        return restApi.query({
            ref: '/' +taskId,
            start: 1,
            pageSize: 2,
            limit: 10,
            order: 'Rank',
            fetch: ['FormattedID', 'Name', 'Owner']
        });
    }

    var defectPromises = [];
    var userStoryPromises = [];

    if(state.branch){
        var branchUserStory = state.branch.match(userStoryRegex);
        var branchDefect = state.branch.match(defectRegex);
        if(branchUserStory){
            userStoryPromises.push(getTaskUnit(branchUserStory[1]));
        }

        if(branchDefect){
            defectPromises.push(getTaskUnit(branchDefect[1]));
        }
    }

    if(state.commits){
        state.userStories = [];
        state.defects = [];
        state.tasks = [];
        state.rallyUsers = [];

        state.commits.forEach(function(msg){

            var userStoryMatch = msg.match(userStoryRegex);

            var defectMatch = msg.match(defectRegex);

            if(userStoryMatch){
                userStoryPromises.push(getTaskUnit(userStoryMatch[1]));
            }

            if(defectMatch){
                defectPromises.push(getTaskUnit(defectMatch[1]));
            }

        });
    }
    var taskPromises = [];

    function handleTasks(userStory){

        var taskRegex = /.*[\/](\w+\/.*\/Tasks)/;

        if(userStory.Tasks) {
            var match = taskRegex.exec(userStory.Tasks._ref);
            if(match){
                taskPromises.push(getTasks(match[1]));
            }
        }
    }

    if(defectPromises.length === 0 && userStoryPromises.length === 0){
        cb();
    }
    else {
        Q.allSettled(defectPromises).then(function (defectResponse) {
            if(defectResponse && defectResponse[0] && defectResponse[0].value && Array.isArray(defectResponse[0].value.Results)) {
                defectResponse[0].value.Results.forEach(function (defect) {

                    state.defects.push({
                        id: defect.FormattedID,
                        name: defect.Name,
                        state: defect.ScheduleState
                    });

                    handleTasks(defect);

                });
            }
            return Q.allSettled(userStoryPromises);
        }).then(function (userStoriesResponse) {

            if(userStoriesResponse && userStoriesResponse[0] && userStoriesResponse[0].value && Array.isArray(userStoriesResponse[0].value.Results)) {
                userStoriesResponse[0].value.Results.forEach(function (userStory) {

                    state.userStories.push({
                        id: userStory.FormattedID,
                        name: userStory.Name,
                        state: userStory.ScheduleState
                    });


                    handleTasks(userStory);

                });
            }

        }).then(function(){
            Q.allSettled(taskPromises).then(function(tasksResponse){

                if(tasksResponse && tasksResponse[0] && tasksResponse[0].value && Array.isArray(tasksResponse[0].value.Results)) {
                    var uniqueUsers = {};
                    tasksResponse[0].value.Results.forEach(function (task) {

                        var owner = '';
                        if(task.Owner) {
                            if (opts.plugins.rally.nameTranslator) {
                                if (opts.plugins.rally.nameTranslator[task.Owner._refObjectName]) {
                                    owner = opts.plugins.rally.nameTranslator[task.Owner._refObjectName];
                                }
                                else {
                                    owner = task.Owner._refObjectName;
                                }
                            }
                            else {
                                owner = task.Owner._refObjectName;
                            }

                            uniqueUsers[owner] = true;
                        }

                        if(task) {
                            state.tasks.push({
                                name: task.Name,
                                owner: owner
                            });
                        }
                    });

                    Object.keys(uniqueUsers).forEach(function(user){
                        state.rallyUsers.push(user);
                    });

                    cb();
                }
                else {
                    cb();
                }
            }, function(err){
                console.log('', err);
            });
        });
    }

};