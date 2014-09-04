'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, $location, WebRTC, $timeout){
  $scope.room = {};
  $scope.room.name = $location.hash();
  $scope.myStream = {};
  $scope.main = {};
  WebRTC.join($scope.room.name);
  //using settimeout to wait until user stream is available
  $scope.setInitial = function(){
    var stream = WebRTC.myStream();
    console.log('stream', stream);
    if(!stream){
      $timeout(function(){
        $scope.setInitial();
      }, 1000);
    } else {
      $scope.main = stream;
      $scope.myStream = stream;
      //Need access to raw element for cross browser support
      var mainElem = angular.element.find('.main')[0];

      //from components/socket/adapter.js
      attachMediaStream(mainElem, $scope.main);
    }
  };

  $scope.setInitial();
  $scope.sidebarVideos = ['assets/test-videos/bunny.mp4', 'assets/test-videos/html5-video-element-test.mp4', 'assets/test-videos/quadcopter.webm', 'assets/test-videos/small.mp4'];
  $scope.supplantMain = function(video) {
    console.log('Old: ', $scope.main);
    var index = $scope.sidebarVideos.indexOf(video);
    $scope.sidebarVideos[index] = $scope.main;
    $scope.main = video;
    console.log('New: ', $scope.main);
  };

  //Pauses own video streams
  $scope.toggleMyVideo = function(){
    WebRTC.toggleVideo();
  };

  $scope.toggleMyAudio = function(){
    WebRTC.toggleAudio();
  };
  console.log($scope.room.name);
});