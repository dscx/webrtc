var socketio = require('socket.io/');

var namesUsed = {};

module.exports.listen = function(app) {
  io = socketio.listen(app);
  io.on('connection', function(socket) {

    console.log("JOINED");

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
      console.log("MESSAGE RECEIVED.");
      console.log(namesUsed[obj.roomNumber])
      socket.broadcast.to(obj.roomNumber).emit('message', {user: obj.user, text: obj.text});   
    });
  });
  return io;
};

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

