/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    function log(label, data, data2){
        //if(opts.log){
            console.log('', label, data, data2);
        //}
    }

    var userStoryRegex = /(us[0-9]+)/i;
    var defectRegex = /(de[0-9]+)/;

    var rallyOpts = opts.plugins.rally;

    var rally = require('rally');

    var Q = require('q');

    //console.log('', opts.plugins.rally);
    var restApi = rally(rallyOpts);
    var queryUtils = rally.util.query;

    function getTaskUnit(formattedId){
        log('getting ', formattedId, ' from rally');
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
    state.userStories = [];
    state.defects = [];
    state.tasks = [];
    state.rallyUsers = [];

    if(state.commits && rallyOpts.readCommits){
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

        log('task handeler');
        var taskRegex = /.*[\/](\w+\/.*\/Tasks)/;

        if(userStory.Tasks) {

            log('handeling task');

            var match = taskRegex.exec(userStory.Tasks._ref);
            if(match){

                log('handeling task' + match[1]);

                taskPromises.push(getTasks(match[1]));
            }
        }
    }

    function isValidResult(response) {
        return response && response[0] && response[0].value && Array.isArray(response[0].value.Results);
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

            if(isValidResult(defectResponse)) {
                defectResponse[0].value.Results.forEach(handleTaskUnits(state.defects));
            }
            else {
                log('invalid defect response');
            }

            return Q.allSettled(userStoryPromises);
        }).then(function (userStoriesResponse) {

            log('settling user stories');
            if(isValidResult(userStoriesResponse)) {
                userStoriesResponse[0].value.Results.forEach(handleTaskUnits(state.userStories));
            }
            else {
                log('invalid user story response');
            }

        //}).then(function(){
            return Q.allSettled(taskPromises).then(function(tasksResponse){

                log('settling tasks');

                if(isValidResult(tasksResponse)) {
                    var uniqueUsers = {};
                    tasksResponse[0].value.Results.forEach(function (task) {

                        var owner = '';
                        if(task.Owner) {
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

                    //cb();
                }
                else {
                    console.log('rally, results were not array');
                    //cb();
                }
            }, function(err){
                console.log('rally error', err);
                //cb();
            });
        }).then(function(){
            console.log('finished rally');
            cb();
        });
    }

};