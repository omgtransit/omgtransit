require('log-timestamp');
require('dotenv').config();

console.log('Starting API server.');

/**
 * Module dependencies.
 */

var express      = require('express');
var fs           = require('fs');
var http         = require('http');
var path         = require('path');
var url          = require('url');

var _ = require('lodash');

// Redis
var redis        = require("redis"),
    redisclient  = redis.createClient('6379', process.env.redis_host);


GLOBAL.backendUrl = 'https://dev.omgtransit.com';

// App settings
var app              = express();

var routes          = require('./routes');
var stop            = require('./routes/stop');
var ondemand        = require('./routes/ondemand');
var decision_engine = require('./routes/decision_engine');

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.compress());
app.use(app.router);
app.enable('trust proxy');
app.use(express.static(path.join(__dirname, 'public')));

// Listen for any options request
app.options("*", function (req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Finish preflight request.
  res.writeHead(204);
  res.end();
});

// Index Route
app.get( '/',                                                 routes.index           );
app.get( '/v0/:system/:stopid',                               routes.index           );
app.get( '/v0/table',                                         stop.list              );
app.get( '/v0/routes',                                        stop.routes            );
app.get( '/v0/bounds',                                        stop.bounds            );
app.get( '/v0/stop/:system/:stopid',                          stop.get               );
app.post( '/v0/stop/:system/:stopid',                         stop.get               );
app.get( '/v0/deceng/:origin/:destination/:mode/:start_time', decision_engine.engine );
app.get( '/v0/ondemand/:system/eta',                          ondemand.eta           );
app.get( '/v0/rideshare/:system/:lat/:lon',                   stop.rideshare         );
app.get( '/v0/rideshares/', stop.rideshares );
app.get( '/v0/uber/time/:lat/:lon',                           stop.uber              );

var status_message={};
fs.readFile('../status-message', 'utf8', function(err,data){
  if(err){
    console.error('UNABLE TO LOAD STATUS MESSAGE!');
    return;
  }
  status_message=JSON.parse(data);
});

app.get('/v0/statusbar-message', function(req,res){
  // CORS Headers - Cross origin resource sharing.
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  return res.json(status_message);
});

app.get('/v1/statusbar-message', function(req,res){
  // CORS Headers - Cross origin resource sharing.
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  var url_parts = url.parse(req.url, true);
  var platform  = url_parts.query.platform.toLowerCase();
  redisclient.get('status-message-'+platform, function(err, reply) {
    if(err){
      console.error('Could not fetch status message for',platform);
      return res.json({message:''});
    } else if (reply) {
      return res.json(JSON.parse(reply));
    } else {
      return res.json({message:''});
    }
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function (error) {
  console.log(error.stack);
});