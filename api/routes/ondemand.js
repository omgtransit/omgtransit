
/*
 * GET table.
 */

var _            = require('lodash');
var Q            = require('q');
var request      = require('request');
var transit_defs = require('../lib/transit_defs');

exports.eta = function(req, res) {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      //'location': [req.query.lon, req.query.lat]

  var system = req.params.system.toLowerCase();

  if(typeof(transit_defs.defs[system])==="undefined"){
    res.writeHead(401);
    res.end();
    return;
  }

  var eta_url = transit_defs.defs[system].eta_url;
  eta_url = eta_url.replace('{LAT}',req.query.lat).replace('{LON}',req.query.lon);

  request(eta_url, function (error, response, body) {
    body=JSON.parse(body);
    if(error || response.statusCode!=200 || !body.success){
      console.error('Error acquiring fetching on-demand data for',system);
      res.writeHead(401);
      res.end();
      return;
    }

    var eta = body.closestEta;
    if(eta==-1)
      eta=false;

    var data = {
      eta: eta
    };

    res.json( data );

  });
};

process.on('uncaughtException', function (error) {
  console.log(error.stack);
});