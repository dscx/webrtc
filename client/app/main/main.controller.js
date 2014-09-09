'use strict';

angular.module('webrtcApp')
  .controller('MainCtrl', function ($scope, $http, socket, $location) {

    $scope.create = function(){
      $http.get('/create').success(function(resp){
        $location.path('/'+resp.url);
      });
    };
  });
