'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, WebRTC, $location){
  $scope.room = {};
  var name = $ocation.hash();
  console.log('NAME IS', name);
  $scope.room.name = name;

  var connect = function(room){
    WebRTC.connect(room);
  };
  connect($scope.room.name);
});