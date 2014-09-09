'use strict';

var should = require('should');
var app = require('./app');
var rooms = require('./api/rooms/rooms.model.js');
var request = require('supertest');
var dup;
describe('Accessing Rooms via http', function(){
  after(function(done){
      rooms.remove({}, function(){
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
      request(app)
        .get('/search?room='+dup.url)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if(err) return done(err);
          res.body.should.have.ownProperty('url');
          res.body.url.should.be.instanceof(String);
          res.body.url.should.equal(dup.url);
          done();
        });
    });

    it('Should return Error Object with message notFound when roomname is not found', function(done){
      request(app)
        .get('/search?room=12345')
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if(err) return done(err);
          res.body.should.have.ownProperty('error');
          res.body.error.should.be.instanceof(String);
          res.body.error.should.equal('notFound');
          done();
        });
    });

    it('Should return Error Object with message meetingOver when room status is closed', function(done){
      rooms.findOne({status:'OPEN'}).exec()
        .then(function(room){
          room.status = 'CLOSED';
          room.save(function(err){
            if(err) return done(err);
            request(app)
              .get('/search?room='+dup.url)
              .expect('Content-Type', /json/)
              .end(function(err, res){
                if(err) return done(err);
                  res.body.should.have.ownProperty('error');
                  res.body.error.should.be.instanceof(String);
                  res.body.error.should.equal('meetingOver');
                done();
              })
          })
        })
    });
  });
});