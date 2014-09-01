/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var bcrypt = require('bcrypt');
var socket = require('/config/socketio.js');

module.exports = function(app) {
  var rooms = {};

  // Insert routes below
  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));

  app.use('/auth', require('./auth'));

 
  app.use('/create', function(req, res){
    bcrypt.hash(Date.now().toString(), 1, function(err, hash){
      if(err) throw err;
      var url = Math.floor(Math.random()*16777215).toString(16);
      rooms[url] = hash;
      //create room
      socket.createRoom(url);
      res.redirect('/rooms/' + url);
    });
  });

  app.use('/rooms', function(req, res){
    res.send('hello world');
  });
  
  app.use('/search', function(req, res){
    if(rooms[req.room] !== undefined){
      socket.setRoom(req.room);
      res.redirect('/rooms/' + req.room);
    }
    else {
      res.send(404);
    }
  });


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });

  return rooms;
};
