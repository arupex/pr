/**
 * Created by daniel.irwin on 6/27/16.
 */
module.exports = function(opts, state, cb){

    var template;
    var fs = require('fs');
    var Mustache = require('mustache');

    if(opts && opts.template){
        template = fs.readFileSync(process.cwd() + '/' + opts.template, 'utf8');
    }
    else {
        template = fs.readFileSync(__dirname + '/../defaultTemplate.mustache', 'utf8');
    }

    console.log('\n\nPull Request Markdown\n\n',Mustache.render(template, state),'\n\n');

    cb();
};