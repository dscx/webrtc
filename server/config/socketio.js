/**
 * Socket.io configuration
 */

'use strict';



var config = require('./environment');
var routes = require('./routes.js');

var allRooms = {};
// When the user disconnects.. perform this
function onDisconnect(socket) {
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

function onCallStart(socket){
  socket.on('offer', function(data){
    socket.broadcast.emit(data)
  })
}

function onCallAnswer(socket){
  socket.on('answer', function(answer){
    socket.emit(answer);
  })
}

var getMedia = function(elem){
  getUserMedia({
    audio: true,
    video: true,
    requestedMediaTypes: true
  });
};

exports.createRoom = function(room){
  var roomId = room;
  allRooms[roomId] = 1;
  //as people join add 1
  //as people leave, remove 1
  return roomId;
};

exports.setRoom = function(room){

}

  // Insert sockets below
  require('../api/thing/thing.socket').register(socket);
}


module.exports = function (socketio) {
 
// var namespace = socketio.of('/rooms');




//  namespace.on('connection', function(socket){
//     console.log('someone connected to the nsp')
//     socket.join(/*room hash */);
    
//   })


  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });




    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket.address);
  });


};