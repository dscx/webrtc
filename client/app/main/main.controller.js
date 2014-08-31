'use strict';

angular.module('webrtcApp')
  .factory('RoomName', function(){
    var room = {};
    function setRoom(name){
      room.name = name;
    }

    function getRoom(){
      return room.name;
    }

    return {
      get:getRoom,
      set:setRoom
    };
  })
  .controller('MainCtrl', function ($scope, $http, socket, $location, RoomName) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.create = function(){
      $http.get('/create').success(function(resp){
        RoomName.set(resp);
        $location.path('/rooms');
      });
    };
    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });
