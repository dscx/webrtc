'use strict';

angular.module('webrtcApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
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

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });