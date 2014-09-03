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
        url:'/rooms/',
        templateUrl: 'app/rooms/webrtc.html',
        controller: 'RoomController'
      })
      .state('/search', {
        url:'/search?room',
        template: '<h3>Searching</h3>',
        //temp controller and template
        controller:function($location, $http){
          var room = $location.hash();
          if(room === undefined){
            location.path('/');
          } else {
            $http.get('/search', {param:{room:room}})
              .then(function(resp){
                $location.path('/rooms/');
                $location.hash(resp.url);
              });
          }

        }
      });
  });