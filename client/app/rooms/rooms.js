'use strict';

angular.module('webrtcApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('rooms', {
        url:'/rooms',
        templateUrl: 'app/rooms/rooms.html',
        controller: 'RoomController'
      });
  });