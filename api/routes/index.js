
/*
 * GET index.
 */

var realtime = require('../lib/realtime.js');
var url = require('url');
var parser = require('../lib/parser');
var Db = require('mongodb').Db;
var transit_defs = require('../lib/transit_defs');

var mongoClient;

Db.connect(process.env.mongo_host, function(err, db) {
  if(err) {
    console.log("Error Starting up Mongo!@");
    console.log(err);
    return;
  }
  console.log('Starting up mongo.');
  mongoClient = db;
});

exports.index = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var callback  = url_parts.query.callback;
  var template  = url_parts.query.template; //TODO(Richard): Shouldn't the callback be able to cover this?
  
  var system = req.params.system.toLowerCase();
  var stopid = req.params.stopid; //.toLowerCase();

  var stopid = system+'/'+stopid;
  
  // CORS Headers - Cross origin resource sharing.
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (system === 'hourcar') {

    // ======================================================
    // Static systems
    // Note: These systems are static and need to be run through a parser!!!
    // ======================================================

    var source_id = transit_defs.defs[system].id;
    mongoClient.collection('mongo_stops').find({ source_id: source_id, stop_id: req.params.stopid }).toArray(function(err, response) {
      if(err) {
        res.writeHead(401);
        res.end();
        return console.dir(err);
      }

      var stop = parser.parsers[system](response[0]);
      res.json({ content: stop });
      return;
    });
  } else {
    
    // ======================================================
    // Proceed with realtime
    // ======================================================

    var realtimestop = new realtime.Realtime(stopid);
  
    //If the real-time source for the system is us, then, at this point, all such
    //systems are bulk-loaded into Redis at a rate which is sufficiently fast that
    //a client should never need to wait for a response
    
    if(!realtimestop.good){
      console.log("Failed to make a good realtime stop!");
      res.json(false);
      return;
    }

    //TODO(Richard): Callbacks and templates should be specified by the client!
    realtimestop.getRealtime().then(function(result){
      var reply={content:result};
      if(typeof(realtimestop.jsclient_callback)!=="undefined")
        reply['callback']=realtimestop.jsclient_callback;
      res.json( reply );  
    });

  }
};