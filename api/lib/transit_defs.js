require('log-timestamp');
var fs   = require('fs');
var path = require('path');

var transit_defs = {}

var path   = require('path');
var appDir = path.dirname(__dirname);

appDir = appDir.replace(/api\/.*/,'api/'); //Bring us back to the app's root directory

var tdef_path=path.join(appDir,'../transit_defs.json');
    
console.log('Loading transit_defs from: ' + tdef_path);

transit_defs = fs.readFileSync(tdef_path);
transit_defs = JSON.parse(transit_defs);

var tsys = transit_defs.transit_systems;
transit_defs.transit_systems={};

for (var i = 0; i < tsys.length; ++i)
  transit_defs.transit_systems[tsys[i].name.toLowerCase()]=tsys[i];

exports.types = transit_defs.transit_types;
exports.defs  = transit_defs.transit_systems;