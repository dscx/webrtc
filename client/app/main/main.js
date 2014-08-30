'use strict';

angular.module('webrtcApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .state('/rooms', {
        url:'/rooms',
        template: '<h1>hello</h1>',
        controller: 'RoomController'
      });
  });