/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
require('./config/express')(app);
var rooms = require('./routes')(app);
require('./config/socketio')(socketio, rooms);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;



// Chat
var io = require('socket.io')(server);
var namesUsed = {};

io.on('connection', function(socket) {

  socket.on('roomNumber', function(roomNumber) {
    socket.join(roomNumber);
    if (!namesUsed.hasOwnProperty(roomNumber)) {
      namesUsed[roomNumber] = [];
    }
    var num = 1;
    while (true) {
      if (namesUsed[roomNumber].indexOf(num) === -1) {
        break;
      }
      num++;
    }
    namesUsed[roomNumber].push(num);
    var user = "Guest_" + num;
    socket.emit('user', {
      success: true,
      user: user
    });
  });

  socket.on('message', function(obj) {
    socket.broadcast.to(obj.roomNumber).emit('message', {user: obj.user, text: obj.text});
  });

});

function findClientsSocket(roomId, namespace) {
  var res = [];
  var ns = io.of(namespace || "/");

  if (ns) {
    for (var id in ns.connected) {
      if (roomId) {
        var index = ns.connected[id].rooms.indexOf(roomId);
        if (index !== -1) {
          res.push(ns.connected[id]);
        }
      } else {
        res.push(ns.connected[id]);
      }
    }
  }
  return res;
}
