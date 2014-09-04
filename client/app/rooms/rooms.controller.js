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
  $scope.sidebarVideos = {links:{}, length:0};
  $scope.setAvideo = function(){
    var keys = Object.keys($scope.sidebarVideos.links);
    // if a new video has been added
    if(keys.length > $scope.sidebarVideos.length){
      // find sidebar
      var sidebarElem = angular.element.find('.sidebar-videos')[0];
      // find new videos
      for (var i = $scope.sidebarVideos.length; i < keys.length; i++) {
        console.log('New Video',$scope.sidebarVideos.links[keys[i]]);
        var vidElem = angular.element('<video class="video individual" autoplay></video>');
        angular.element(sidebarElem).append(vidElem);
        attachMediaStream(vidElem[0], $scope.sidebarVideos.links[keys[i]]);
      }
      $scope.sidebarVideos.length = keys.length;
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