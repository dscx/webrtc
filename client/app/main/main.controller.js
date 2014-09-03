'use strict';

angular.module('webrtcApp')
  .controller('MainCtrl', function ($scope, $http, socket, $location) {
    $scope.awesomeThings = [];

    var query = $location.search();
    if(query.room !== undefined){
      $http.get('/search', {params:{room:query.room}})
        .success(function(resp){
          if(resp.url === query.room){
            $location.hash(resp.url);
            $location.path('/rooms/');
            console.log(resp);
          } else {
            $location.search({});
          }
          
        });
    }

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.create = function(){
      $http.get('/create').success(function(resp){
        $location.path('/rooms/');
        $location.hash(resp.url);
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
