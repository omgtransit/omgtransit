var expect = require("chai").expect;
var moment = require('moment');
var n = require("../background/notification.js");
var realtime = require('../lib/realtime.js');
var Db = require('mongodb').Db;

// var realtime = [ { time: 1397243340,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: true,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397243820,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: true,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397244420,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: false,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397245020,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: false,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397245620,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: false,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397246160,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: false,
//     departure: true,
//     updated: 1397242877 },
//   { time: 1397246760,
//     direction: 'east',
//     route: '16',
//     description: 'Univ Av / St Paul',
//     actual: false,
//     departure: true,
//     updated: 1397242877 }];

var alert, mongoClient;
 
describe("Notifications", function() {

  before(function(done) {
    
    
    Db.connect(process.env.mongo_host, function(err, db) {
      if(err) {
        console.log("Error Starting up Mongo!@");
        console.log(err);
        return;
      }
      console.log('Starting up mongo.');
      mongoClient = db;

      alert = mongoClient.collection('mongo_alerts').insert({
        device_token: 'TESTING_TOKEN',
        alert_time: 18.01,
        realtime_url: 'MSP/16562',
        route: 16,
        platform: 'iOS',
        recurring: true,
        stop_name: 'University Av & 25 Av SE',
        recurring_days: 'mon,tue,wed,thu,fri',
        offset: 5,
        start_time: 17.51
      }, function(err, docs) {
        alert = docs[0];
        done();
      });
    });
  });

  
  describe("#notification", function() {
    it("should have defined variables for notfication services", function() {
      expect(n.notification).to.not.be.undefined;
    });

    it("should be able to find a basic alert", function(done) {
      
      n.notification.findAlerts(18.01, 17.56).then(function(results) {
        expect(results.length).to.equal(1);
        done();
      });
    });

    it("should be able to filter out a alert out of range", function(done) {
      n.notification.findAlerts(17.50).then(function(results) {
        expect(results.length).to.equal(0);
        done();
      });
    });

    it("should be able to filter OUT 5 min past the range", function(done) {
      n.notification.findAlerts(18.06, 18.07).then(function(results) {
        expect(results.length).to.equal(0);
        done();
      });
    });

    it("should be able to filter IN 4 min past the range", function(done) {
      n.notification.findAlerts(18.06, 18.01).then(function(results) {
        expect(results.length).to.equal(1);
        done();
      });
    });

    it("should check the realtime data and determine if we should send", function(done) {
      n.notification.findAlerts(18.01, 18.01).then(function(results) {
        var alert = results[0];
        var realtime = [ { time: moment(Date.now()).add('m', 6).unix(),
            direction: 'east',
            route: '16',
            stop_name: 'University Av & 25 Av SE',
            actual: true,
            departure: true,
            updated: 1397242877 }];

        var send1 = n.notification.shouldWeSend(realtime, alert);
        expect(send1.status).to.be.true;
        
        var message = n.notification.determineMessage( send1.minAway, alert.route, alert.stop_name );
        expect(message).to.equal('The 16 is 6 min away from University Av & 25 Av SE');

        alert.offset = 4;

        var send2 = n.notification.shouldWeSend(realtime, alert);
        expect(send2.status).to.be.false;

        done();
      });
      
    });

    it("should be able to update a recurring alert", function(done) {
      expect(alert.last_recurring_at).to.be.undefined;
      
      n.notification.updateAlert({ _id: alert._id });

      setTimeout(function() {
        n.notification.findAlerts(18.01, 18.01).then(function(results) {
          var result = results[0];

          expect( moment(result.last_recurring_at).format('MM/DD/YYYY') ).to.equal( moment().format('MM/DD/YYYY') )
          done();
        });
      }, 1000);
    });

    it("should be able to delete a non-recurring alert", function(done) {
      n.notification.deleteAlert({ _id: alert._id });

      setTimeout(function() {
        n.notification.findAlerts(18.01, 18.01).then(function(results) {
          expect(results.length).to.equal(0);
          done();
        });
      }, 1000);

    });
  });

  after(function() {
    mongoClient.collection('mongo_alerts').remove({_id: alert._id}, function() {});
  });

});