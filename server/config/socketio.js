/**
 * Socket.io configuration
 */

'use strict';



var config = require('./environment');
var db = require('../api/rooms/rooms.controller.js');

var allRooms = {};

// When the user disconnects.. perform this
function onDisconnect(socket) {
}

//deletes room from DB
function closeRoom(room){
  db.end(room);
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


module.exports = function (socketio, cache) {

console.log("eneter")
var namespace = socketio.of('/rooms');

 //joins namespace when user enters room
 namespace.on('connection', function(socket){
    console.log('someone connected to the namespace');
    socket.address = socket.handshake.address !== null ?
          socket.handshake.address.address + ':' + socket.handshake.address.port :
          process.env.DOMAIN;
    
    socket.on('room', function(roomId){
      socket.join(roomId.room);

      if(!allRooms[roomId.room]){
        allRooms[roomId.room] = [];
      }

      if(!allRooms[roomId.room].counter){
        allRooms[roomId.room].counter = 1;
      } else{
        allRooms[roomId.room].counter++;
      }


      var pid = allRooms[roomId.room].length;
      allRooms[roomId.room].push(socket);

      var room = roomId.room;
      var otherPids = Array.apply(null, {length: pid}).map(Number.call, Number);
      socket.emit('confirm', {pids:otherPids, pid:pid, room:room}); //include PID's

      //emits to all on conference the new participants information
      socket.to(room).emit('new', {pid:pid});
      socket.on('disconnect', function(socket){
        if(room !== undefined){
          allRooms[room][pid] = null;
          allRooms[room].counter--;
          namespace.to(room).emit('left', {pid:pid});
          console.log(allRooms[room].counter, "remaining participants")
            if(allRooms[room].counter === 0){
              delete allRooms[room];
              var roomHash = cache[room];
              delete cache[room];
              closeRoom(roomHash);

              console.log("Room Closed");
           }
        }
      });

      //Signalling below
      socket.on('offer', function(info){
        var to = allRooms[info.room][info.recipient];
        if(to){
          to.emit('offer', info);
          console.log('forwarding offer');
        }
      });

        //replies to each offer
      socket.on('answer', function(response){
        var target = allRooms[response.room][response.recipient];
        if(target){
          target.emit('answer', response);
          console.info('answering call...');
        }
      });

      socket.on('ice', function(info){
        
        var to = allRooms[info.room][info.recipient];
        if(to){
          to.emit('ice', info);   
          console.log('forwarding ice');
        }   
      });
    });

  });

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