/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var userStoryRegex = /(us[0-9]*)/i;
    var defectRegex = /(de[0-9]*)/;

    var rally = require('rally');

    var Q = require('q');

    //console.log('', opts.plugins.rally);
    var restApi = rally(opts.plugins.rally);
    var queryUtils = rally.util.query;

    function getTaskUnit(formattedId){
        return restApi.query({
            type: formattedId.toUpperCase().indexOf('US') > -1?'hierarchicalrequirement':'defect',
            start: 1,
            pageSize: 2,
            limit: 10,
            order: 'Rank',
            fetch: ['FormattedID', 'Name', 'ScheduleState'],
            query: queryUtils.where('FormattedID', '=', formattedId)
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
                });
            }
            cb();
        });
    }

};