'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, $location, WebRTC, $timeout){
  $scope.room = {};
  $scope.room.name = $location.hash();
  $scope.myStream = {};
  $scope.main = {};
  $scope.meetingLink = 'http://localhost:9000/search?room='+$scope.room.name;
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
  $scope.sidebarVideos = {links:{}};
  $scope.setAvideo = function(){
    var keys = Object.keys($scope.sidebarVideos.links);
    if(keys.length > 0){
      var vidElem = angular.element.find('.individual')[0];
      if(!vidElem.src){
        attachMediaStream(vidElem, $scope.sidebarVideos.links[keys[0]]);
      }
    }
  };

  $scope.updateStreams = function(){
    //console.log(WebRTC.getStreams);
    $timeout(function(){
      $scope.sidebarVideos.links = WebRTC.getStreams;
      $scope.setAvideo();
      $scope.updateStreams();
    }, 1000);
  };


  $scope.updateStreams();
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