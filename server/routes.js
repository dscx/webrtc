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

 
  app.use('/create', function(req, res){
    bcrypt.hash(Date.now().toString(), 1, function(err, hash){

      if(err){
        console.log(err);
        res.status(500).send();
        return;
      }
      rooms.create(hash)
        .then(function(room){
          var url = Math.floor(Math.random()*16777215).toString(16);
          cache[url] = room.room;
          res.json({url:url, room:room.room});          
        });
    });
  });

  app.use('/rooms', function(req, res){
    res.redirect('/');
  });
  
  app.use('/search', function(req, res){
    var r = req.query.room;

    var roomHash = cache[r];
    if(roomHash !== undefined){
      rooms.find(roomHash).then(function(room){
        if(room){
          res.json({url:r});
        } else {
          res.json({error: "meetingOver"});
        }
      })
    }
    else{ 
      res.json({error: 'notFound'});
    }
  });


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
    return cache;
};
