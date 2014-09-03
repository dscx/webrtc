var Room = require('./rooms.model');

module.exports.model = Room;
module.exports.create = function(hash, i){
  if(i){
    hash = hash + '' + i;
  } else {
    i = 0;
  }
  return Room.findOne({room:hash}).exec()
  .then(function(found){
    if(found){
      return module.exports.create(hash, i+1);
    } else {
      var newRoom = new Room({room:hash, status:'OPEN'});
      newRoom.save();
      return newRoom;
    }
  })
};

module.exports.find = function(room){
  return Room.findOne({room:room}).exec()
    .then(function(found){
      if(found){
        if(found.status === 'OPEN'){
          return found;
        }
      }
      return false;
    })
};

module.exports.end = function(room){
  return Room.findOneAndUpdate({room:room}, {status:'CLOSED'})
    .exec().then(function(resp){
      return resp;
    });
};