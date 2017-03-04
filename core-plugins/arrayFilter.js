/**
 * Created by daniel.irwin on 3/4/17.
 */

//Allows you to filter out users/etc from arrays, as well as drop in replace for things like party parrots
//or translating names from rally to github or another network/etc
module.exports = function (opts, state, cb) {

    var arrayFilter = opts.plugins.arrayFilter;
    if (arrayFilter) {
        Object.keys(arrayFilter).forEach(function (stateKey) {

            var replacers = arrayFilter[stateKey];

            state[stateKey] = state[stateKey].filter(function (stateArrayValues) {
                return !(typeof stateArrayValues === 'string' && typeof replacers[stateArrayValues.toLowerCase()] === 'boolean' && !replacers[stateArrayValues.toLowerCase()]);
            }).map(function (stateArrayValues) {
                if (typeof stateArrayValues === 'string' && replacers[stateArrayValues.toLowerCase()]) {
                    return stateArrayValues.replace(stateArrayValues, replacers[stateArrayValues.toLowerCase()]);
                }
                return stateArrayValues;
            });

        });
    }
    cb();
};