'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, $location){
  $scope.room = {};
  $scope.room.name = $location.hash();
  $scope.main = 'assets/test-videos/keypeele.webm';
  $scope.sidebarVideos = ['assets/test-videos/bunny.mp4', 'assets/test-videos/html5-video-element-test.mp4', 'assets/test-videos/quadcopter.webm', 'assets/test-videos/small.mp4'];
  $scope.supplantMain = function(video) {
    console.log('Old: ', $scope.main);
    var index = $scope.sidebarVideos.indexOf(video);
    $scope.sidebarVideos[index] = $scope.main;
    $scope.main = video;
    console.log('New: ', $scope.main);
  };
  console.log($scope.room.name);
});