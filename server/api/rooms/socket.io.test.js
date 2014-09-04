var io = require('socket.io-client');

var client = io.connect('http://localhost:9000/rooms', {port:9000});
console.log(client);
client.on('connect', function(){
  console.log('connected');
});

client.on('error', function(err){
  console.log(err);
});

