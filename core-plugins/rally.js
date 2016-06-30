/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    function log(label, data, data2){
        if(opts.log){
            console.log('', label?label:'', data?data:'', data2?data2:'');
        }
    }

    var userStoryRegex = /(us[0-9]+)/i;
    var defectRegex = /(de[0-9]+)/i;

    var rallyOpts = opts.plugins.rally;

    var rally = require('rally');

    var Q = require('q');

    //log('', opts.plugins.rally);
    var restApi = rally(rallyOpts);
    var queryUtils = rally.util.query;

    function getTaskUnit(formattedId){
        var lowerCaseFid = formattedId.toLowerCase();

        //log('getting ', lowerCaseFid, ' from rally');
        return restApi.query({
            type: lowerCaseFid.indexOf('us') > -1?'hierarchicalrequirement':'defect',
            start: 1,
            pageSize: 2,
            limit: 10,
            order: 'Rank',
            fetch: ['FormattedID', 'Name', 'ScheduleState', 'Tasks'],
            query: queryUtils.where('FormattedID', '=', lowerCaseFid)
        });
    }


    function getTasks(taskId){
        log('getting ', taskId, ' from rally');
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

    var uniqueUserStories = {};
    var uniqueDefects = {};

    if(state.branch){
        var branchUserStory = state.branch.match(userStoryRegex);
        var branchDefect = state.branch.match(defectRegex);
        if(branchUserStory){
            uniqueUserStories[branchUserStory[1]] = true;
            //userStoryPromises.push(getTaskUnit(branchUserStory[1]));
        }

        if(branchDefect){
            uniqueDefects[branchDefect[1]] = true;
            //defectPromises.push(getTaskUnit(branchDefect[1]));
        }
    }
    state.userStories = [];
    state.defects = [];
    state.tasks = [];
    state.rallyUsers = [];

    if(state.commits && rallyOpts.readCommits){


        state.commits.forEach(function(msg){

            var userStoryMatch = msg.match(userStoryRegex);

            var defectMatch = msg.match(defectRegex);

            if(userStoryMatch){
                uniqueUserStories[userStoryMatch[1]] = true;
                //userStoryPromises.push(getTaskUnit(userStoryMatch[1]));
            }

            if(defectMatch){
                uniqueDefects[defectMatch[1]] = true;
                //defectPromises.push(getTaskUnit(defectMatch[1]));
            }

        });
    }

    Object.keys(uniqueUserStories).forEach(function(us){
        userStoryPromises.push(getTaskUnit(us));
    });

    Object.keys(uniqueDefects).forEach(function(de){
        defectPromises.push(getTaskUnit(de));
    });

    var taskPromises = [];

    function handleTasks(userStory){

        //log('task handeler');
        var taskRegex = /.*[\/](\w+\/.*\/Tasks)/;

        if(userStory.Tasks) {

            //log('handeling task');

            var match = taskRegex.exec(userStory.Tasks._ref);
            if(match){

                log('handeling task' + match[1]);

                taskPromises.push(getTasks(match[1]));
            }
        }
    }

    function isValidResult(response) {
        return response.value && Array.isArray(response.value.Results);
    }

    if(defectPromises.length === 0 && userStoryPromises.length === 0){
        cb();
    }
    else {

        function handleTaskUnits(store) {

            return function handleUnit(unit) {
                //log('handeling unit', unit);
                store.push({
                    id: unit.FormattedID,
                    name: unit.Name,
                    state: unit.ScheduleState
                });

                handleTasks(unit);
            };
        }

        Q.allSettled(defectPromises).then(function (defectResponse) {
            log('settling defects');

            if(defectResponse && Array.isArray(defectResponse)){
                defectResponse.forEach(function singleDefectResponse(defect){
                    if(isValidResult(defect)) {
                        defect.value.Results.forEach(handleTaskUnits(state.defects));
                    }
                    else {
                        log('invalid defect response');
                    }
                })
            }

            return Q.allSettled(userStoryPromises);
        }).then(function (userStoriesResponse) {

            log('settling user stories');
            if(userStoriesResponse && Array.isArray(userStoriesResponse)){
                userStoriesResponse.forEach(function singleUserStoryResponse(userStory){
                    if(isValidResult(userStory)) {

                        //log('', userStory);

                        userStory.value.Results.forEach(function(result){
                            //log('\n\n Story', result, '\n\n');
                            handleTaskUnits(state.userStories)(result);
                        });
                    }
                    else {
                        log('invalid user story response');
                    }
                });
            }
            else {
                log('invalid user story response');
            }


        //}).then(function(){
            return Q.allSettled(taskPromises).then(function(tasksResponse) {

                //log('settling tasks', tasksResponse);
                var uniqueUsers = {};
                if (tasksResponse && Array.isArray(tasksResponse)) {
                    tasksResponse.forEach(function singleTaskResponse(taskResp) {
                        if (isValidResult(taskResp)) {


                            taskResp.value.Results.forEach(function (task) {

                                var owner = '';
                                if (task.Owner) {
                                    var nameTranslator = rallyOpts.nameTranslator;
                                    var ownerRefName = task.Owner._refObjectName;

                                    if (nameTranslator) {
                                        if (nameTranslator[ownerRefName]) {
                                            owner = nameTranslator[ownerRefName];
                                        }
                                        else {
                                            owner = ownerRefName;
                                        }
                                    }
                                    else {
                                        owner = ownerRefName;
                                    }

                                    uniqueUsers[owner] = true;
                                }

                                if (task) {
                                    state.tasks.push({
                                        name: task.Name,
                                        owner: owner
                                    });
                                }
                            });
                        }
                        else {
                            log('tasks were not valid');
                        }
                    });
                }
                else {
                    log('invalid tasks');
                }


                Object.keys(uniqueUsers).forEach(function (user) {
                    state.rallyUsers.push(user);
                });


                //cb();
            }, function(err){
                log('rally error', err);
                //cb();
            });
        }).then(function(){
            log('finished rally');
            cb();
        });
    }

};