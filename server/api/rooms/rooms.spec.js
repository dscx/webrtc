'use strict';

var should = require('should');
var app = require('../../app');
var rooms = require('./rooms.controller.js');
var request = require('supertest');
var dup;

describe('Accessing Rooms', function(){
  after(function(done){
      rooms.model.remove({}, function(){
      done();
    });
  });

  describe('GET /create', function() {
    it('Should respond with json string', function(done) {
      request(app)
        .get('/create')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          dup = res.body;
          res.body.should.be.instanceof(Object);
          done();
        });
    });
  });
  describe('GET /search', function(done){
    it('Should get rooms when provided roomname', function(done){
      rooms.find(dup.room)
        .then(function(room){
          room.room.should.equal(dup.room);
          done();
        });
    });

    it('Should return false when roomname is not found', function(done){
      rooms.find('OneTwoThree')
        .then(function(room){
          room.should.equal(false);
          done();
        });
    });
  });
  describe('On meeting end', function(done){
    it('Should set meeting status to closed on end', function(done){
      rooms.end(dup.room)
        .then(function(room){
          room.status.should.equal('CLOSED');
          done();
        })
    });
    it('Should return false if room status is not open', function(done){
      rooms.find(dup.room)
        .then(function(room){
          room.should.equal(false);
          done();
        });
    });
  });

});