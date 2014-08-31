'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, RoomName){
  $scope.room = {};
  $scope.room.name = RoomName.get();

  console.log($scope.room.name);
});