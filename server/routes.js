/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var bcrypt = require('bcrypt');
var socket = require('./config/socketio.js');


module.exports = function(app) {
  var cache = {};

  // Insert routes below
  var rooms = require('./api/rooms/rooms.controller');
  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));

  app.use('/auth', require('./auth'));

 
  app.use('/create', function(req, res){
    bcrypt.hash(Date.now().toString(), 1, function(err, hash){

      if(err){
        console.log(err);
        res.send(500);
        return;
      }
      rooms.create(hash)
        .then(function(room){
          var url = Math.floor(Math.random()*16777215).toString(16);
          cache[url] = room.room;
          res.send({url:url, room:room.room});          
        });
    });
  });

  app.use('/rooms', function(req, res){
    res.redirect('/');
  });
  
  app.use('/search', function(req, res){
    var r = req.query.room;
    if(req.headers.referer === undefined){
      res.redirect('/?room='+ r);
      return;
    }

    var roomHash = cache[r];
    if(roomHash !== undefined){
      rooms.find(roomHash).then(function(room){
        if(room){
          res.send({url:r});
        } else {
          res.send(404, "meeting over");
        }
      })
    }
    else{ 
      console.log('SENT 404');
      res.redirect('/*');
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
    return cache;
};
