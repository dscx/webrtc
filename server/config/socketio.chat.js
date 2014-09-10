var namesUsed = {};

module.exports.listen = function(io) {
  var namespace = io.of('/chat');
  namespace.on('connection', function(socket) {

    console.log("Chat: Joined");

    socket.on('roomNumber', function(roomNumber) {
      console.log("ROOM");
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
      console.log("Chat: Message received");
      socket.broadcast.to(obj.roomNumber).emit('message', {user: obj.user, text: obj.text});   
    });
  });
  return io;
};
