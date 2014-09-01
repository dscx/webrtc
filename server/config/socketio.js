/**
 * Socket.io configuration
 */

'use strict';



var config = require('./environment');

var allRooms = {};
var clients = [];


// When the user disconnects.. perform this
function onDisconnect(socket) {
}

function closeRoom(room){
  if(allRooms[room] === 0){
    delete allRooms[room];
  }
}

function onCallStart(socket){
    socket.broadcast.emit(offer)
}

function onCallAnswer(socket){
    socket.emit(answer);
}



// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.log('testing')
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  // Insert sockets below
  require('../api/thing/thing.socket').register(socket);
}


module.exports = function (socketio) {
 
// var namespace = socketio.of('/rooms');

//  namespace.on('connection', function(socket){
//     console.log('someone connected to the nsp')
//     socket.join(/*room hash */);
    
//   })

// var createRoom = function(room){
//   var roomId = room;
//   allRooms[roomId] = 1;
//   console.log(allRooms);
//   return roomId;
// };

  socketio.on('connection', function (socket) {

    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;


    socket.connectedAt = new Date();

    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket.address);

    socket.on('offer', function(offer){
      onCallStart(socket);
      console.info('starting call...')
    });

    socket.on('answer', function(answer){
      onCallAnswer(socket);
      console.info('answering call...')
    });

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });
  });


};