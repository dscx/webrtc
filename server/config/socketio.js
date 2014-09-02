/**
 * Socket.io configuration
 */

'use strict';



var config = require('./environment');
var db = require('../api/rooms/rooms.controller.js');

var allRooms = {};
var clients = [];


// When the user disconnects.. perform this
function onDisconnect(socket) {
}

function closeRoom(room){
  db.end(room);
}


// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.log('testing')
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2), 'PIES');
  });

  // Insert sockets below
  require('../api/thing/thing.socket').register(socket);
}


module.exports = function (socketio, cache) {
 
var namespace = socketio.of('/rooms');

 namespace.on('connection', function(socket){
    console.log('someone connected to the nsp');
    socket.address = socket.handshake.address !== null ?
          socket.handshake.address.address + ':' + socket.handshake.address.port :
          process.env.DOMAIN;
    
    socket.on('room', function(roomId){
      socket.join(roomId.room);
      if(!allRooms[roomId.room]){
        allRooms[roomId.room] = [];
      }
      
      var pid = allRooms[roomId.room].length;
      socket.webRoom = roomId.room;
      allRooms[roomId.room].push(socket);
      //console.log(socket.webRoom, 'room name');
      console.log(allRooms[socket.webRoom].length); 

           
      var room = roomId.room;

      socket.on('disconnect', function(socket){
        if(room !== undefined){
          allRooms[room].splice(pid, 1);
            if(allRooms[room].length === 0){
              delete allRooms[room];
              var roomHash = cache[room];
              delete cache[room];
              closeRoom(roomHash);
           }
        }
      });

      socket.on('offer', function(offer){
       socket.broadcast.emit('offer', {'offer': offer, 'pid': pid, 'room': room});
        // console.log(socket.address, 'address');
        console.info('starting call...');
      });

      socket.on('answer', function(response){
        var target = allRooms[response.room][response.pid];
        target.emit('answer', response.answer);
        console.info('answering call...');
      });

    });

  })


  socketio.on('connection', function (socket) {

    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;


    socket.connectedAt = new Date();

    // Call onConnect.
    //onConnect(socket);
    console.info('[%s] CONNECTED', socket.address);

    

    // Call onDisconnect.
    // socket.on('disconnect', function () {
    //   //onDisconnect(socket);
    //   console.info('[%s] DISCONNECTED', socket.address);
    // });
  });


};