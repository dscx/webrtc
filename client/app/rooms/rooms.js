'use strict';

angular.module('webrtcApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('rooms', {
        url:'/{roomHash}',
        templateUrl: 'app/rooms/rooms.html',
        controller: 'RoomController'
      });
  });