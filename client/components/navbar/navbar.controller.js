'use strict';

angular.module('webrtcApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
    }];

    $scope.isCollapsed = true;
    $scope.room = { 
      inroom:false, 
      search:'', 
      error:false,
      notFound:false,
      meetingOver:false,
    };
    $scope.resetError = function(){
      $scope.room.error = false;
      $scope.room.notFound = false;
      $scope.room.meetingOver = false;
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });