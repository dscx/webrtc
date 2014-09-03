'use strict';

var should = require('should');
var app = require('../app');
var rooms = require('../api/rooms/rooms.controller.js');
var request = require('supertest');
var socket = require('./socketio.js');
//var io = require('socket.io-emitter');
//angular http backend
//html file include angular & socketio client

var dup;
 
 var client = io('http://localhost/rooms', {
      path:'/socket.io-client'
    });

 setTimeout(function(){
  io.emit('room', {room: 'test'});
}, 5000);

 setInterval(function(){
  io.emit('offer', function(request){
      var response = {
        answer: 'PIE',
        pid: request.pid,
        room:request.room
      };
      socket2.emit('answer', response);
    })
}, 5000);

describe('Joining Rooms', function() {
    it('Should join a new room on create', function(done) {
      request(app)
        .get('/create')
        .end(function(err, res) {
          if (err) return done(err);
          dup = res.body;
          client.emit('room', {'room': res.url})
          client.on('confirm', function(){
          console.log('half way');
            done();
          });
        });

    });

    it('Should joing existing rooms', function(done) {
       
      
    });

    it('Should send an offer to all other users when joining', function(done) {
       
    });

    it('Should send an answer to each offer received', function(done) {
     
    });

  });

describe('Leaving rooms', function(){
    it('Should remove user when disconnecting from a room', function(done){
   
    });
     it('Should remove meeting from DB when closed', function(done){
   
    });
});
