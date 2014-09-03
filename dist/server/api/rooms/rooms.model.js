'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var roomSchema = new Schema({
  room: {
    type:String,
    required:true,
    index: {
      unique: true
    }
  },
  status: {
    type:String,
    required:true,
  }
});

module.exports = mongoose.model('Room', roomSchema);